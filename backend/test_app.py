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
        self.app = create_app(f"sqlite:///{database.as_posix()}")
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.app.state.engine.dispose()
        self.tmp.cleanup()

    def register(self, username="keeper01"):
        return self.client.post("/api/v1/auth/register", json={"username": username, "password": "safe-password-123"})

    def test_account_can_save_logout_and_restore(self):
        self.assertEqual(self.client.get("/api/v1/health").json(), {"status": "ok", "saveContract": "independent-chapters-v6"})
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.client.get("/api/v1/auth/me").json()["username"], "keeper01")
        self.assertEqual(self.client.get("/api/v1/save").json()["revision"], 0)

        saved = self.client.put("/api/v1/save", json={"progress": sample_progress(), "baseRevision": 0})
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.json()["revision"], 1)
        self.assertEqual(saved.json()["progress"]["contentVersion"], "legacy-v1")
        self.assertEqual(saved.json()["progress"]["records"]["list"]["foundClueIds"], ["list-fold"])

        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/save").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "safe-password-123"}).status_code, 200)
        self.assertEqual(self.client.get("/api/v1/save").json()["progress"]["keeperNumber"], "2026-3780")

    def test_new_content_version_round_trips_without_changing_legacy_save(self):
        self.assertEqual(self.register().status_code, 201)
        progress = sample_progress()
        progress["contentVersion"] = "independent-chapters-v3"
        progress["records"]["list"]["foundClueIds"] = ["list-task"]
        progress["records"]["list"]["completedInteractions"] = ["list-mud-cleared"]
        progress["records"]["list"]["markerPositions"] = {"list-task": {"x": 34, "y": 35}}
        saved = self.client.put("/api/v1/save", json={"progress": progress, "baseRevision": 0})
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(self.client.get("/api/v1/save").json()["progress"]["contentVersion"], "independent-chapters-v3")
        self.assertEqual(self.client.get("/api/v1/save").json()["progress"]["records"]["list"]["completedInteractions"], ["list-mud-cleared"])

    def test_map_four_clues_and_history_stations_survive_login(self):
        self.assertEqual(self.register().status_code, 201)
        progress = sample_progress()
        progress["contentVersion"] = "independent-chapters-v3"
        progress["records"]["map"] = {
            "status": "investigating",
            "foundClueIds": ["map-near-route", "map-north-bank", "map-lower-bank", "map-crossing"],
            "completedInteractions": ["map-back-viewed", "map-caption-supported", "map-story-saved", "map-history-01", "map-history-02"],
            "classified": {}, "markerPositions": {},
            "acceptedConclusionIds": [], "rejectedClaimIds": [],
            "screeningVerified": True, "evidenceVerified": True,
            "historyRevealed": True, "historyRead": False,
        }
        saved = self.client.put("/api/v1/save", json={"progress": progress, "baseRevision": 0})
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "safe-password-123"}).status_code, 200)
        restored = self.client.get("/api/v1/save").json()["progress"]["records"]["map"]
        self.assertEqual(len(restored["foundClueIds"]), 4)
        self.assertIn("map-history-02", restored["completedInteractions"])
        self.assertTrue(restored["historyRevealed"])

    def test_battery_four_clues_and_migration_backup_survive_login(self):
        self.assertEqual(self.register().status_code, 201)
        progress = sample_progress()
        progress["contentVersion"] = "independent-chapters-v4"
        progress["records"]["battery"] = {
            "status": "investigating",
            "foundClueIds": ["battery-old-band", "battery-terminal", "battery-note", "battery-blank"],
            "completedInteractions": ["battery-band-lifted", "battery-right-viewed", "battery-lid-opened", "battery-story-saved", "battery-history-01"],
            "classified": {}, "markerPositions": {},
            "acceptedConclusionIds": [], "rejectedClaimIds": [],
            "screeningVerified": True, "evidenceVerified": True,
            "historyRevealed": True, "historyRead": False,
        }
        progress["legacyBatteryRecord"] = {
            **progress["records"]["battery"],
            "status": "archived", "foundClueIds": ["battery-cut"],
        }
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": progress, "baseRevision": 0}).status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "safe-password-123"}).status_code, 200)
        restored = self.client.get("/api/v1/save").json()["progress"]
        self.assertEqual(restored["contentVersion"], "independent-chapters-v4")
        self.assertEqual(len(restored["records"]["battery"]["foundClueIds"]), 4)
        self.assertIn("battery-history-01", restored["records"]["battery"]["completedInteractions"])
        self.assertEqual(restored["legacyBatteryRecord"]["foundClueIds"], ["battery-cut"])

    def test_shoes_story_and_four_history_stations_survive_login(self):
        self.assertEqual(self.register().status_code, 201)
        progress = sample_progress()
        progress["contentVersion"] = "independent-chapters-v5"
        progress["records"]["shoes"] = {
            "status": "investigating",
            "foundClueIds": ["shoes-measure", "shoes-repair", "shoes-wear", "shoes-cord"],
            "completedInteractions": [
                "shoes-separated", "shoes-measured", "shoes-light-on",
                "shoes-large-repair-viewed", "shoes-small-repair-viewed",
                "shoes-large-sole-viewed", "shoes-small-sole-viewed",
                "shoes-wear-traced", "shoes-cord-lifted", "shoes-story-saved",
                "shoes-history-01", "shoes-history-02", "shoes-history-03", "shoes-history-04",
            ],
            "classified": {}, "markerPositions": {},
            "acceptedConclusionIds": [], "rejectedClaimIds": [],
            "screeningVerified": True, "evidenceVerified": True,
            "historyRevealed": True, "historyRead": True,
        }
        progress["legacyShoesRecord"] = {
            **progress["records"]["shoes"],
            "status": "archived", "foundClueIds": ["shoes-patch"],
        }
        saved = self.client.put("/api/v1/save", json={"progress": progress, "baseRevision": 0})
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "safe-password-123"}).status_code, 200)
        restored = self.client.get("/api/v1/save").json()["progress"]
        self.assertEqual(restored["contentVersion"], "independent-chapters-v5")
        self.assertEqual(len(restored["records"]["shoes"]["foundClueIds"]), 4)
        self.assertIn("shoes-history-04", restored["records"]["shoes"]["completedInteractions"])
        self.assertEqual(restored["legacyShoesRecord"]["foundClueIds"], ["shoes-patch"])

    def test_bowl_story_history_and_legacy_backup_survive_login(self):
        self.assertEqual(self.register().status_code, 201)
        progress = sample_progress()
        progress["contentVersion"] = "independent-chapters-v6"
        progress["records"]["bowl"] = {
            "status": "archived",
            "foundClueIds": ["bowl-unwrapped", "bowl-rim", "bowl-marks", "bowl-paper"],
            "completedInteractions": [
                "bowl-wrapper-opened", "bowl-rotated", "bowl-light-on", "bowl-base-viewed",
                "bowl-paper-turned", "bowl-story-saved", "bowl-history-01", "bowl-history-02",
                "bowl-history-03", "bowl-history-04",
            ],
            "classified": {}, "markerPositions": {}, "acceptedConclusionIds": [], "rejectedClaimIds": [],
            "screeningVerified": True, "evidenceVerified": True, "historyRevealed": True, "historyRead": True,
        }
        progress["legacyBowlRecord"] = {
            **progress["records"]["bowl"], "status": "investigating", "foundClueIds": ["bowl-note"],
        }
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": progress, "baseRevision": 0}).status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "safe-password-123"}).status_code, 200)
        restored = self.client.get("/api/v1/save").json()["progress"]
        self.assertEqual(restored["contentVersion"], "independent-chapters-v6")
        self.assertEqual(len(restored["records"]["bowl"]["foundClueIds"]), 4)
        self.assertIn("bowl-history-04", restored["records"]["bowl"]["completedInteractions"])
        self.assertEqual(restored["legacyBowlRecord"]["foundClueIds"], ["bowl-note"])

    def test_conflicts_and_other_accounts_are_isolated(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.register().status_code, 409)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "keeper01", "password": "wrong-pass-123"}).status_code, 401)
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": sample_progress(), "baseRevision": 0}).status_code, 200)
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": sample_progress("2026-9999"), "baseRevision": 0}).status_code, 409)
        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 200)
        self.assertEqual(self.register("keeper02").status_code, 201)
        self.assertIsNone(self.client.get("/api/v1/save").json()["progress"])

    def test_retrying_same_snapshot_does_not_create_false_conflict(self):
        self.assertEqual(self.register().status_code, 201)
        progress = sample_progress()
        first = self.client.put("/api/v1/save", json={"progress": progress, "baseRevision": 0})
        self.assertEqual(first.status_code, 200)
        repeated = self.client.put("/api/v1/save", json={"progress": progress, "baseRevision": 0})
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.json()["revision"], first.json()["revision"])
        changed = self.client.put("/api/v1/save", json={"progress": sample_progress("2026-9999"), "baseRevision": 0})
        self.assertEqual(changed.status_code, 409)

    def test_new_revision_updates_once_and_rejects_stale_changes(self):
        self.assertEqual(self.register().status_code, 201)
        first = self.client.put("/api/v1/save", json={"progress": sample_progress(), "baseRevision": 0})
        self.assertEqual(first.status_code, 200)
        second_progress = sample_progress("2026-9999")
        second = self.client.put("/api/v1/save", json={"progress": second_progress, "baseRevision": 1})
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json()["revision"], 2)
        self.assertEqual(self.client.get("/api/v1/save").json()["progress"]["keeperNumber"], "2026-9999")
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": sample_progress("2026-1111"), "baseRevision": 1}).status_code, 409)
        repeated = self.client.put("/api/v1/save", json={"progress": second_progress, "baseRevision": 1})
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.json()["revision"], 2)

    def test_save_survives_new_app_instance(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.client.put("/api/v1/save", json={"progress": sample_progress(), "baseRevision": 0}).status_code, 200)
        database_url = str(self.app.state.engine.url)
        with TestClient(create_app(database_url)) as reopened:
            self.assertEqual(reopened.post("/api/v1/auth/login", json={"username": "keeper01", "password": "safe-password-123"}).status_code, 200)
            self.assertEqual(reopened.get("/api/v1/save").json()["progress"]["records"]["list"]["foundClueIds"], ["list-fold"])
            reopened.app.state.engine.dispose()

    def test_rejects_unknown_object(self):
        self.register()
        invalid = sample_progress()
        invalid["records"]["unknown"] = invalid["records"]["list"]
        response = self.client.put("/api/v1/save", json={"progress": invalid, "baseRevision": 0})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
