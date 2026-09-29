/**
 * utils/userModels.js
 * Users live in four collections, one per role. Look the model up here rather
 * than re-implementing the role switch in each controller.
 */
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Admin } from "../models/AdminModel.js";

// Portal members (everyone except admins)
export const MEMBER_MODELS = { Student, Teacher, Alumni };
const USER_MODELS = { ...MEMBER_MODELS, Admin };

// Any role, including Admin → model, or null
export const getModelByRole = (role) => USER_MODELS[role] ?? null;

// Student / Teacher / Alumni only → model, or null (admins are not members)
export const getMemberModel = (role) => MEMBER_MODELS[role] ?? null;

// Mentors are Alumni or Teachers
export const getMentorModel = (role) => (role === "Alumni" || role === "Teacher" ? MEMBER_MODELS[role] : null);
