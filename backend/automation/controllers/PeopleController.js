import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Student } from "../models/StudentModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Teacher } from "../models/TeacherModel.js";

// Everyone can see everyone:
// Student  → sees Alumni + Teachers + other Students
// Alumni   → sees Students + Teachers + other Alumni
// Teacher  → sees Students + Alumni + other Teachers
// Only restriction: you never see yourself
const visibleRoles = {
  Student: ["Student", "Alumni", "Teacher"],
  Alumni:  ["Student", "Alumni", "Teacher"],
  Teacher: ["Student", "Alumni", "Teacher"],
  Admin:   ["Student", "Alumni", "Teacher"],
};

// GET /api/v1/people
export const getPeople = catchAsyncError(async (req, res) => {
  const user    = req.user;
  const myRole  = user.constructor.modelName;
  const allowed = visibleRoles[myRole] || [];

  const { search, filterRole, department } = req.query;

  const rolesToQuery = filterRole && filterRole !== "All"
    ? [filterRole]
    : allowed;

  const searchFilter = search
    ? { $or: [
        { name:       { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ]}
    : {};

  const deptFilter = department && department !== "All"
    ? { department }
    : {};

  const baseFilter = {
    accountVerified: true,
    _id: { $ne: user._id }, // never show yourself
    ...searchFilter,
    ...deptFilter,
  };

  const fields = {
    Student: "name email department year skills bio linkedIn github enrollmentNumber",
    Alumni:  "name email department graduationYear currentCompany currentDesignation industry skills bio linkedIn github availableForMentorship profilePhoto",
    Teacher: "name email department designation experience qualifications bio linkedIn profilePhoto",
  };

  const queries = rolesToQuery.map(async (role) => {
    let Model;
    if (role === "Student")      Model = Student;
    else if (role === "Alumni")  Model = Alumni;
    else if (role === "Teacher") Model = Teacher;
    else return [];

    const docs = await Model.find(baseFilter).select(fields[role]);
    return docs.map((d) => ({ ...d.toObject(), role }));
  });

  const results = await Promise.all(queries);
  const people  = results.flat();

  res.status(200).json({ success: true, count: people.length, people });
});