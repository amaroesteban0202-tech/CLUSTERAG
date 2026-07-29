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

test("every active organization role can create tasks in every task room", () => {
  for (const role of Object.keys(ROLE_DEFINITIONS)) {
    for (const permission of TASK_CREATE_PERMISSIONS) {
      assert.equal(
        hasPermission({ role, isActive: true }, permission),
        true,
        `${role} must include ${permission}`,
      );
    }
  }
});

test("inactive organization users cannot create tasks", () => {
  for (const role of Object.keys(ROLE_DEFINITIONS)) {
    for (const permission of TASK_CREATE_PERMISSIONS) {
      assert.equal(hasPermission({ role, isActive: false }, permission), false);
    }
  }
});

test("the frontend cannot force extra super administrators", () => {
  assert.deepEqual(
    [...SUPER_ADMIN_EMAILS].sort(),
    [...DEFAULT_SUPER_ADMIN_EMAILS].sort(),
  );
});
