import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Student } from "../models/StudentModel.js";
import { Alumni } from "../models/AlumniModel.js";

const STUDENT_FIELDS = "name email department enrollmentYear year skills bio linkedIn profilePhoto";
const ALUMNI_FIELDS  = "name email department enrollmentYear currentCompany currentDesignation industry skills bio linkedIn profilePhoto";

// GET /api/v1/batchmates
// Groups students + alumni by enrollmentYear ("Class of YEAR")
// Teachers are never shown here — they use same endpoint with viewerRole=Teacher
export const getBatchmates = catchAsyncError(async (req, res) => {
  const { search } = req.query;

  const nameFilter = search
    ? { $or: [{ name: { $regex: search.trim(), $options: "i" } }] }
    : {};

  const baseFilter = { accountVerified: true, ...nameFilter };

  const [rawStudents, rawAlumni] = await Promise.all([
    Student.find(baseFilter).select(STUDENT_FIELDS),
    Alumni.find(baseFilter).select(ALUMNI_FIELDS),
  ]);

  const students = rawStudents.map((d) => ({ ...d.toObject(), role: "Student" }));
  const alumni   = rawAlumni.map((d)   => ({ ...d.toObject(), role: "Alumni"  }));
  const allUsers = [...students, ...alumni];

  // Group by enrollmentYear
  const grouped = {};
  for (const user of allUsers) {
    const key = user.enrollmentYear ?? "unset";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(user);
  }

  // Sort: newest year first, unset always last
  const batches = Object.entries(grouped)
    .map(([key, members]) => ({
      year: key === "unset" ? null : Number(key),
      members,
    }))
    .sort((a, b) => {
      if (a.year === null) return  1;
      if (b.year === null) return -1;
      return b.year - a.year;
    });

  res.status(200).json({ success: true, totalUsers: allUsers.length, batches });
});
