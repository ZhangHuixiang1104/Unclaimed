import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app import create_app


def sample_progress(keeper_number: str = "2026-3780") -> dict:
    return {
        "keeperNumber": keeper_number,
        "records": {
            "list": {
                "status": "investigating",
                "foundClueIds": ["list-fold"],
                "classified": {},
                "markerPositions": {"list-fold": {"x": 26, "y": 31}},
                "acceptedConclusionIds": [],
                "rejectedClaimIds": [],
                "screeningVerified": False,
                "evidenceVerified": False,
                "historyRevealed": False,
                "historyRead": False,
            }
        },
        "selectedObjectKey": "list",
        "createdAt": "2026-10-16T12:00:00.000Z",
    }


class AccountSaveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=Path(__file__).parent / "data")
        database = Path(self.tmp.name) / "test.db"
        self.app = create_app(f"sqlite:///backend/data/{database.parent.name}/test.db")
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.app.state.engine.dispose()
        self.tmp.cleanup()

    def register(self, username="keeper01"):
        return self.client.post("/api/v1/auth/register", json={"username": username, "password": "safe-password-123"})

    def test_account_can_save_logout_and_restore(self):
        self.assertEqual(self.client.get("/api/v1/health").json(), {"status": "ok"})
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.client.get("/api/v1/auth/me").json()["username"], "keeper01")
        self.assertEqual(self.client.get("/api/v1/save").json()["revision"], 0)

        saved = self.client.put("/api/v1/save", json={"progress": sample_progress(), "baseRevision": 0})
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.json()["revision"], 1)
        self.assertEqual(saved.json()["progress"]["records"]["list"]["foundClueIds"], ["list-fold"])

        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/save").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "safe-password-123"}).status_code, 200)
        self.assertEqual(self.client.get("/api/v1/save").json()["progress"]["keeperNumber"], "2026-3780")

    def test_conflicts_and_other_accounts_are_isolated(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.register().status_code, 409)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "wrong-pass-123"}).status_code, 401)
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": sample_progress(), "baseRevision": 0}).status_code, 200)
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": sample_progress("2026-9999"), "baseRevision": 0}).status_code, 409)
        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.register("keeper02").status_code, 201)
        self.assertIsNone(self.client.get("/api/v1/save").json()["progress"])

    def test_rejects_unknown_object(self):
        self.register()
        invalid = sample_progress()
        invalid["records"]["unknown"] = invalid["records"]["list"]
        response = self.client.put("/api/v1/save", json={"progress": invalid, "baseRevision": 0})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
