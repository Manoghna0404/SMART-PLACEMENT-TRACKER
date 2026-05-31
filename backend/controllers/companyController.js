import Company from '../models/Company.js';
import { checkEligibility } from '../utils/eligibilityChecker.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { notifyPlacementDriveCreation } from '../services/notificationService.js';

const defaultRounds = [
  { name: 'Applied', type: 'Application', sequence: 1 },
  { name: 'Round 1', type: 'Aptitude', sequence: 2 },
  { name: 'Round 2', type: 'Technical', sequence: 3 },
  { name: 'HR Round', type: 'HR', sequence: 4 },
  { name: 'Offer Released', type: 'Offer', sequence: 5 },
];

const normalizeRounds = (rounds = []) => {
  const list = Array.isArray(rounds) && rounds.length ? rounds : defaultRounds;
  return list
    .filter((round) => round?.name)
    .map((round, index) => ({
      name: round.name.trim(),
      type: round.type || 'Other',
      sequence: Number(round.sequence || index + 1),
      passingCriteria: round.passingCriteria || '',
      scheduledAt: round.scheduledAt || null,
      mode: round.mode || 'Online',
      meetingLink: round.meetingLink || '',
      location: round.location || '',
      status: round.status || 'Draft',
    }))
    .sort((a, b) => a.sequence - b.sequence);
};

export const getCompanies = asyncHandler(async (req, res) => {
  const { role, minPackage, deadline, branch } = req.query;
  const filter = { isActive: true };
  if (role) filter.role = new RegExp(role, 'i');
  if (deadline === 'upcoming') filter.deadline = { $gte: new Date() };
  if (branch) filter['eligibility.branches'] = branch;

  let companies = await Company.find(filter).sort({ deadline: 1 });
  if (minPackage) {
    companies = companies.filter((company) => {
      const amount = Number(String(company.package).replace(/[^\d.]/g, ''));
      return amount >= Number(minPackage);
    });
  }
  res.json(companies);
});

export const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  res.json(company);
});

export const addCompany = asyncHandler(async (req, res) => {
  const company = await Company.create({ ...req.body, rounds: normalizeRounds(req.body.rounds) });
  await notifyPlacementDriveCreation(company);
  res.status(201).json(company);
});

export const updateCompany = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.rounds) updates.rounds = normalizeRounds(updates.rounds);
  const company = await Company.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  res.json(company);
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  res.json({ message: 'Company removed' });
});

export const getEligibleCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ isActive: true });
  const eligible = companies
    .map((company) => ({
      company,
      ...checkEligibility(req.user, company),
    }))
    .filter((item) => item.eligible);

  res.json(eligible);
});
