import assert from "node:assert/strict";
import test from "node:test";
import { SUPER_ADMIN_EMAILS } from "../../src/app/constants/app.constants.js";
import { DEFAULT_SUPER_ADMIN_EMAILS } from "../config/bootstrap.js";
import { ROLE_DEFINITIONS } from "../constants/permissions.js";
import { hasPermission } from "./permissions.js";

const TASK_CREATE_PERMISSIONS = [
  "create_account_tasks",
  "create_editing_tasks",
  "create_management_tasks",
];

test("operational roles can create tasks while viewer remains read-only", () => {
  for (const role of Object.keys(ROLE_DEFINITIONS).filter((item) => item !== "viewer")) {
    for (const permission of TASK_CREATE_PERMISSIONS) {
      assert.equal(
        hasPermission({ role, isActive: true }, permission),
        true,
        `${role} must include ${permission}`,
      );
    }
  }
  for (const permission of TASK_CREATE_PERMISSIONS) {
    assert.equal(hasPermission({ role: "viewer", isActive: true }, permission), false);
  }
});

test("inactive organization users cannot create tasks", () => {
  for (const role of Object.keys(ROLE_DEFINITIONS)) {
    for (const permission of TASK_CREATE_PERMISSIONS) {
      assert.equal(hasPermission({ role, isActive: false }, permission), false);
    }
  }
});

test("no privileged identities are shipped in application source", () => {
  assert.deepEqual(SUPER_ADMIN_EMAILS, []);
  assert.deepEqual(DEFAULT_SUPER_ADMIN_EMAILS, []);
});
