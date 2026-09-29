// profileCompletion.js — whether a user has filled in the profile fields their
// role requires. Layouts use these to show the "complete your profile" prompt,
// so they live here rather than in the Profile pages (which load lazily).

export const isProfileComplete = (student) =>
  !!(student?.department && student.department !== "Not Set" && student?.year && student?.enrollmentNumber && student?.bio);

export const isTeacherProfileComplete = u =>
  !!(u?.department && u.department !== "Not Set" && u?.designation && u.designation !== "Not Set" && u?.employeeId && u?.bio);

export const isAlumniProfileComplete = u =>
  !!(u?.department && u.department !== "Not Set" && u?.currentCompany && u?.bio && u?.graduationYear);
