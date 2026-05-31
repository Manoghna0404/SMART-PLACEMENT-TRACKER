export const checkEligibility = (student, company) => {
  const { cgpa = 0, branch = '', backlogs = 0, skills = [] } = student;
  const { minCgpa = 0, maxBacklogs = 0, branches = [], requiredSkills = [] } = company.eligibility || {};

  const cgpaOk = cgpa >= minCgpa;
  const backlogOk = backlogs <= maxBacklogs;
  const branchOk =
    branches.length === 0 ||
    branches.some((b) => b.toLowerCase() === branch.toLowerCase());
  const normalizedSkills = skills.map((skill) => skill.toLowerCase());
  const skillsOk =
    requiredSkills.length === 0 ||
    requiredSkills.every((skill) => normalizedSkills.includes(skill.toLowerCase()));

  const reasons = {
    cgpa: cgpaOk ? null : `CGPA ${cgpa} below required ${minCgpa}`,
    backlogs: backlogOk ? null : `Backlogs ${backlogs} exceed limit ${maxBacklogs}`,
    branch: branchOk ? null : `Branch ${branch || 'not set'} not in eligible list`,
    skills: skillsOk ? null : `Missing required skills: ${requiredSkills.join(', ')}`,
  };

  return {
    eligible: cgpaOk && backlogOk && branchOk && skillsOk,
    reasons,
    reasonList: Object.values(reasons).filter(Boolean),
  };
};

export default checkEligibility;
