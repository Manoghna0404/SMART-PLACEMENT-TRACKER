export const calculatePlacementStats = (students, applications) => {
  const totalStudents = students.length;
  const placedStudents = students.filter((s) => s.isPlaced).length;
  const placementPercentage = totalStudents
    ? Math.round((placedStudents / totalStudents) * 100)
    : 0;

  const branchStats = {};
  students.forEach((s) => {
    const branch = s.branch || 'Unknown';
    if (!branchStats[branch]) branchStats[branch] = { total: 0, placed: 0 };
    branchStats[branch].total++;
    if (s.isPlaced) branchStats[branch].placed++;
  });

  const branchWise = Object.entries(branchStats).map(([branch, data]) => ({
    branch,
    total: data.total,
    placed: data.placed,
    percentage: data.total ? Math.round((data.placed / data.total) * 100) : 0,
  }));

  const statusCounts = {};
  applications.forEach((app) => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
  });

  const companyHiring = {};
  applications
    .filter((a) => a.status === 'Selected')
    .forEach((app) => {
      const name = app.companyId?.companyName || 'Unknown';
      companyHiring[name] = (companyHiring[name] || 0) + 1;
    });

  const companyWise = Object.entries(companyHiring).map(([company, count]) => ({
    company,
    hires: count,
  }));

  return {
    totalStudents,
    placedStudents,
    unplacedStudents: totalStudents - placedStudents,
    placementPercentage,
    branchWise,
    statusCounts,
    companyWise,
    totalApplications: applications.length,
  };
};
