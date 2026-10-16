"""Account and cloud-save API for 长征失物招领处."""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import time
import uuid
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import ForeignKey, Integer, String, Text, create_engine, select
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


SESSION_SECONDS = 14 * 24 * 60 * 60
OBJECT_KEYS = frozenset({"list", "map", "battery", "shoes", "bowl"})
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,24}$")
COOKIE_NAME = "archive_session"


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    username: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(160))
    created_at: Mapped[int] = mapped_column(Integer)


class LoginSession(Base):
    __tablename__ = "login_sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[int] = mapped_column(Integer)


class CloudSave(Base):
    __tablename__ = "cloud_saves"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    payload: Mapped[str] = mapped_column(Text)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[int] = mapped_column(Integer)


class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=24)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not USERNAME_PATTERN.fullmatch(value):
            raise ValueError("账号名只能使用 3—24 位英文字母、数字、下划线或短横线")
        return value.lower()


class MarkerPosition(BaseModel):
    model_config = ConfigDict(extra="forbid")
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)


class ObjectRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["locked", "available", "investigating", "archived"]
    foundClueIds: list[str] = Field(max_length=3)
    classified: dict[str, Literal["confirmed", "inferred", "unknown"]]
    markerPositions: dict[str, MarkerPosition]
    acceptedConclusionIds: list[str] = Field(max_length=5)
    rejectedClaimIds: list[str] = Field(max_length=5)
    screeningVerified: bool
    evidenceVerified: bool
    historyRevealed: bool
    historyRead: bool


class Progress(BaseModel):
    model_config = ConfigDict(extra="forbid")
    keeperNumber: str = Field(min_length=1, max_length=32)
    records: dict[str, ObjectRecord]
    selectedObjectKey: str | None = None
    keeperNote: str | None = Field(default=None, max_length=50)
    createdAt: str = Field(min_length=1, max_length=64)

    @field_validator("records")
    @classmethod
    def validate_records(cls, value: dict[str, ObjectRecord]) -> dict[str, ObjectRecord]:
        if not value.keys() <= OBJECT_KEYS:
            raise ValueError("存档包含未知物件")
        return value

    @field_validator("selectedObjectKey")
    @classmethod
    def validate_selected_key(cls, value: str | None) -> str | None:
        if value is not None and value not in OBJECT_KEYS:
            raise ValueError("选中的物件不存在")
        return value


class SaveRequest(BaseModel):
    progress: Progress
    baseRevision: int = Field(ge=0)


class SaveResponse(BaseModel):
    progress: Progress | None
    revision: int
    updatedAt: int | None


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt$16384$8$1${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, n, r, p, salt, expected = encoded.split("$")
        if scheme != "scrypt":
            return False
        digest = hashlib.scrypt(
            password.encode("utf-8"), salt=bytes.fromhex(salt),
            n=int(n), r=int(r), p=int(p),
        )
        return hmac.compare_digest(digest, bytes.fromhex(expected))
    except (ValueError, TypeError):
        return False


def create_app(database_url: str | URL | None = None) -> FastAPI:
    if database_url is None:
        database_path = Path(__file__).parent / "data" / "archive.db"
        database_path.parent.mkdir(parents=True, exist_ok=True)
        database_url = os.getenv("ARCHIVE_DATABASE_URL") or URL.create("sqlite+pysqlite", database=str(database_path))

    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False} if str(database_url).startswith("sqlite") else {},
    )
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, expire_on_commit=False)
    app = FastAPI(title="长征失物招领处存档服务", version="1.0")
    app.state.engine = engine

    def get_db():
        with sessions() as db:
            yield db

    def require_user(
        archive_session: Annotated[str | None, Cookie()] = None,
        db: Session = Depends(get_db),
    ) -> User:
        if not archive_session:
            raise HTTPException(status_code=401, detail="请先登录")
        token_hash = hashlib.sha256(archive_session.encode("utf-8")).hexdigest()
        login = db.get(LoginSession, token_hash)
        if login is None or login.expires_at <= int(time.time()):
            raise HTTPException(status_code=401, detail="登录已过期")
        user = db.get(User, login.user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="账号不存在")
        return user

    def set_login_cookie(response: Response, user: User, db: Session) -> None:
        token = secrets.token_urlsafe(32)
        db.add(LoginSession(
            token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
            user_id=user.id,
            expires_at=int(time.time()) + SESSION_SECONDS,
        ))
        db.commit()
        response.set_cookie(
            COOKIE_NAME, token, max_age=SESSION_SECONDS,
            httponly=True, secure=os.getenv("ARCHIVE_COOKIE_SECURE") == "1",
            samesite="lax", path="/api",
        )

    @app.get("/api/v1/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/v1/auth/register", status_code=status.HTTP_201_CREATED)
    def register(credentials: Credentials, response: Response, db: Session = Depends(get_db)) -> dict[str, str]:
        if db.scalar(select(User).where(User.username == credentials.username)):
            raise HTTPException(status_code=409, detail="账号名已被使用")
        user = User(
            id=str(uuid.uuid4()), username=credentials.username,
            password_hash=hash_password(credentials.password), created_at=int(time.time()),
        )
        db.add(user)
        db.commit()
        set_login_cookie(response, user, db)
        return {"username": user.username}

    @app.post("/api/v1/auth/login")
    def login(credentials: Credentials, response: Response, db: Session = Depends(get_db)) -> dict[str, str]:
        user = db.scalar(select(User).where(User.username == credentials.username))
        if user is None or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(status_code=401, detail="账号或密码错误")
        set_login_cookie(response, user, db)
        return {"username": user.username}

    @app.post("/api/v1/auth/logout")
    def logout(
        response: Response,
        archive_session: Annotated[str | None, Cookie()] = None,
        db: Session = Depends(get_db),
    ) -> dict[str, bool]:
        if archive_session:
            token_hash = hashlib.sha256(archive_session.encode("utf-8")).hexdigest()
            login_session = db.get(LoginSession, token_hash)
            if login_session:
                db.delete(login_session)
                db.commit()
        response.delete_cookie(COOKIE_NAME, path="/api")
        return {"ok": True}

    @app.get("/api/v1/auth/me")
    def me(user: User = Depends(require_user)) -> dict[str, str]:
        return {"username": user.username}

    @app.get("/api/v1/save", response_model=SaveResponse)
    def get_save(user: User = Depends(require_user), db: Session = Depends(get_db)) -> SaveResponse:
        saved = db.get(CloudSave, user.id)
        if saved is None:
            return SaveResponse(progress=None, revision=0, updatedAt=None)
        return SaveResponse(progress=Progress.model_validate_json(saved.payload), revision=saved.revision, updatedAt=saved.updated_at)

    @app.put("/api/v1/save", response_model=SaveResponse)
    def put_save(
        request: SaveRequest,
        user: User = Depends(require_user),
        db: Session = Depends(get_db),
    ) -> SaveResponse:
        serialized = request.progress.model_dump_json(exclude_none=True)
        if len(serialized.encode("utf-8")) > 64_000:
            raise HTTPException(status_code=413, detail="存档数据过大")
        saved = db.get(CloudSave, user.id)
        current_revision = saved.revision if saved else 0
        if request.baseRevision != current_revision:
            raise HTTPException(status_code=409, detail="云端存档已被其他设备更新")
        now = int(time.time())
        if saved is None:
            saved = CloudSave(user_id=user.id, payload=serialized, revision=1, updated_at=now)
            db.add(saved)
        else:
            saved.payload = serialized
            saved.revision += 1
            saved.updated_at = now
        db.commit()
        return SaveResponse(progress=request.progress, revision=saved.revision, updatedAt=saved.updated_at)

    return app


app = create_app()
