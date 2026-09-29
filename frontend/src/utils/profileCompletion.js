// profileCompletion.js — the profile fields each role must fill in before an
// admin can verify them. Layouts use this to show the "complete your profile"
// prompt, and the prompt lists the same fields, so both come from one place.

const isSet = (v) => !!v && v !== "Not Set";

export const REQUIRED_PROFILE_FIELDS = {
  Student: [
    { label: "Enrollment Number", key: "enrollmentNumber" },
    { label: "Department",        key: "department" },
    { label: "Year",              key: "year" },
    { label: "Bio",               key: "bio" },
  ],
  Teacher: [
    { label: "Department",  key: "department" },
    { label: "Designation", key: "designation" },
    { label: "Employee ID", key: "employeeId" },
    { label: "Bio",         key: "bio" },
  ],
  Alumni: [
    { label: "Department",      key: "department" },
    { label: "Current Company", key: "currentCompany" },
    { label: "Graduation Year", key: "graduationYear" },
    { label: "Bio",             key: "bio" },
  ],
};

export const isFieldComplete = (user, key) => isSet(user?.[key]);

export const isProfileComplete = (role, user) =>
  (REQUIRED_PROFILE_FIELDS[role] || []).every(({ key }) => isFieldComplete(user, key));
