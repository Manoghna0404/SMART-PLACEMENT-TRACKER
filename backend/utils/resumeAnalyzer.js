import fs from 'fs';

const PLACEMENT_KEYWORDS = [
  'javascript', 'python', 'java', 'react', 'node', 'mongodb', 'sql',
  'data structures', 'algorithms', 'dsa', 'git', 'github', 'aws', 'docker',
  'machine learning', 'html', 'css', 'express', 'api', 'rest', 'typescript',
  'problem solving', 'teamwork', 'leadership', 'project', 'internship',
];

const SECTION_HEADERS = [
  { key: 'objective', titles: ['objective', 'summary', 'career objective', 'professional summary'] },
  { key: 'education', titles: ['education', 'academics', 'academic background'] },
  { key: 'skills', titles: ['skills', 'technical skills', 'skill set', 'expertise'] },
  { key: 'projects', titles: ['projects', 'academic projects', 'project experience'] },
  { key: 'experience', titles: ['experience', 'work experience', 'professional experience'] },
  { key: 'internships', titles: ['internships', 'internship experience'] },
  { key: 'certifications', titles: ['certifications', 'certificates', 'achievements'] },
  { key: 'achievements', titles: ['achievements', 'awards', 'honors'] },
  { key: 'technicalSkills', titles: ['technical skills', 'technical proficiency'] },
  { key: 'softSkills', titles: ['soft skills', 'interpersonal skills', 'strengths'] },
];

const ROLE_SKILLS_MAP = {
  'Software Engineer': ['JavaScript', 'React', 'Node.js', 'TypeScript', 'REST APIs', 'Git', 'SQL', 'Docker', 'Cloud'],
  'Data Analyst': ['Python', 'SQL', 'Tableau', 'Power BI', 'Pandas', 'Excel', 'Statistics', 'Data Visualization'],
  'AI/ML Engineer': ['Python', 'TensorFlow', 'PyTorch', 'scikit-learn', 'NLP', 'Computer Vision', 'Model Deployment', 'Data Engineering'],
  'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'HTML', 'CSS', 'TypeScript'],
  'Cybersecurity': ['Network Security', 'Vulnerability Assessment', 'Penetration Testing', 'Firewalls', 'SIEM', 'Cryptography', 'Linux'],
  'Cloud Engineer': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Networking'],
};

const SOFT_SKILLS = ['communication', 'teamwork', 'leadership', 'adaptability', 'problem solving', 'critical thinking', 'time management', 'collaboration', 'attention to detail'];
const ACTION_VERBS = ['designed', 'built', 'implemented', 'led', 'developed', 'optimized', 'improved', 'delivered', 'created', 'automated'];
const GENERIC_OBJECTIVE_PHRASES = ['looking for a job', 'seeking a job', 'looking for an opportunity', 'seeking an opportunity', 'want to work', 'interested in working', 'hardworking', 'responsible'];
const GENERIC_SKILLS_PHRASES = ['good at', 'skilled in', 'knowledge of', 'strong in', 'proficient in', 'experienced in'];
const IMPACT_KEYWORDS = ['reduced', 'improved', 'increased', 'decreased', 'optimized', 'delivered', 'built', 'designed', 'implemented', 'automated', 'launched'];
const PROOF_METRICS = ['%', 'percent', 'kpi', 'latency', 'throughput', 'revenue', 'cost', 'users', 'performance', 'accuracy', 'uptime', 'speed'];

const normalizeText = (text = '') => text.replace(/\r/g, ' ').replace(/\t/g, ' ').trim();
const splitLines = (text = '') => normalizeText(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const getGrade = (score) => {
  // Professional rarity-aligned grading (avoid frequent 98/99/100)
  if (score >= 95) return 'Industry-Exceptional';
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Average-Good';
  if (score >= 40) return 'Basic';
  return 'Poor';
};

const buildSectionStatus = (ratio) => {
  if (ratio >= 0.75) return 'Good';
  if (ratio >= 0.45) return 'Needs Improvement';
  return 'Missing';
};


const findSectionHeadings = (lines) => {
  const found = [];

  lines.forEach((line, index) => {
    const normalized = line.toLowerCase().replace(/[:.]+$/, '').trim();
    SECTION_HEADERS.forEach((section) => {
      section.titles.forEach((title) => {
        if (normalized === title || normalized.startsWith(`${title}:`) || normalized.startsWith(`${title} -`) || normalized.startsWith(`${title} —`)) {
          found.push({ key: section.key, index, line });
        }
      });
    });
  });

  return found.sort((a, b) => a.index - b.index);
};

const extractSections = (text) => {
  const lines = splitLines(text);
  const headers = findSectionHeadings(lines);
  const sections = {};

  headers.forEach((header, idx) => {
    const nextHeader = headers[idx + 1];
    const bodyLines = [];
    const headingText = header.line.replace(/^.*?:\s*/, '').trim();
    if (headingText && headingText.toLowerCase() !== header.key.toLowerCase()) {
      bodyLines.push(headingText);
    }

    const start = header.index + 1;
    const end = nextHeader ? nextHeader.index : lines.length;
    for (let i = start; i < end; i += 1) {
      bodyLines.push(lines[i]);
    }

    sections[header.key] = bodyLines.join(' ');
  });

  SECTION_HEADERS.forEach((section) => {
    if (!sections[section.key]) {
      const snippet = lines.find((line) =>
        section.titles.some((title) => line.toLowerCase().includes(title))
      );
      sections[section.key] = snippet || '';
    }
  });

  return sections;
};

const parseSkills = (text) => {
  const raw = text.replace(/[•·–—]/g, ',').replace(/\s*\|\s*/g, ',');
  return raw.split(/[,\n]/).map((item) => item.trim()).filter((item) => item && item.length > 1);
};

const sampleRewrite = (original, improved, section) => ({
  section,
  original,
  improved,
});

const generateObjectiveRewrite = (text, role, studentSkills) => {
  const skills = [...new Set([...(studentSkills || []), ...(ROLE_SKILLS_MAP[role] || [])])].slice(0, 5);
  const skillPhrase = skills.length ? `strong ${skills.slice(0, 3).join(', ')}` : 'strong technical skills';
  const roleLabel = role || 'professional';

  if (!text || text.trim().length < 40) {
    return `Aspiring ${roleLabel} with ${skillPhrase} and hands-on experience in project delivery, seeking to contribute to innovative products and growth-focused teams.`;
  }

  return `Aspiring ${roleLabel} with ${skillPhrase}, proven ability to solve problems with effective engineering solutions, and a passion for building high-quality applications that deliver measurable business value.`;
};

const sectionQuality = (text) => {
  if (!text || !text.trim()) return 0;
  const lower = text.toLowerCase();
  if (GENERIC_OBJECTIVE_PHRASES.some((phrase) => lower.includes(phrase))) return 0.25;
  if (text.length < 60) return 0.45;
  return 0.85;
};

const analyzeObjectiveSection = (text, role, studentSkills) => {
  const lower = text.toLowerCase();
  const isMissing = !text.trim();
  const hasPhrase = GENERIC_OBJECTIVE_PHRASES.some((phrase) => lower.includes(phrase));
  const strength = !isMissing && !hasPhrase ? 'Clear objective present' : null;
  const rewrite = generateObjectiveRewrite(text, role, studentSkills);

  const suggestions = [];
  if (isMissing) {
    suggestions.push('Add an objective or summary that clearly defines your target role and strengths.');
  } else {
    if (hasPhrase) {
      suggestions.push('Remove vague statements like “looking for a job” and specify your role, domain and value.');
    }
    if (text.length < 80) {
      suggestions.push('Lengthen the objective slightly to include skills, experience highlights, and what you offer.');
    }
  }

  const atsTips = [
    'Include the target role and relevant keywords early in your summary.',
    'Add technical and domain keywords relevant to the role.',
  ];

  return {
    status: isMissing ? 'Missing' : hasPhrase || text.length < 80 ? 'Needs Improvement' : 'Good',
    summary: text || '',
    feedback: [
      isMissing ? 'Objective / Summary section is missing.' : 'Objective / Summary is detected.',
      strength ? strength : 'Use more action-oriented language and role-specific detail.',
    ].filter(Boolean),
    suggestions,
    atsTips,
    rewrite,
    roleTips: [`Focus the sentence on the ${role} role and measurable outcomes.`],
    replaceSuggestions: isMissing || hasPhrase || text.length < 80 ? [sampleRewrite(text || 'N/A', rewrite, 'Objective / Summary')] : [],
  };
};

const analyzeSkillsSection = (text, role, studentSkills) => {
  const detectedSkills = parseSkills(text);
  const roleKeywords = ROLE_SKILLS_MAP[role] || [];
  const missingRoleSkills = roleKeywords.filter((keyword) =>
    !text.toLowerCase().includes(keyword.toLowerCase())
  );

  const hasSoftSkills = SOFT_SKILLS.some((skill) => text.toLowerCase().includes(skill));
  const suggestions = [];
  if (!text.trim()) {
    suggestions.push('Add a Skills section with clearly separated technical and soft skills.');
  } else {
    suggestions.push('Group skills as Technical Skills, Tools, and Soft Skills for clearer readability.');
    if (missingRoleSkills.length) {
      suggestions.push(`Include skills such as ${missingRoleSkills.slice(0, 4).join(', ')} for a stronger ${role} resume.`);
    }
    if (!hasSoftSkills) {
      suggestions.push('Add a few soft skills relevant to teamwork, communication and problem solving.');
    }
  }

  return {
    status: !text.trim() ? 'Missing' : missingRoleSkills.length > 4 ? 'Needs Improvement' : 'Good',
    summary: text || '',
    detectedSkills,
    missingIndustrySkills: missingRoleSkills.slice(0, 6),
    feedback: [
      !text.trim() ? 'Skills section is missing.' : 'Skills section is present.',
      missingRoleSkills.length
        ? `Role-specific skills missing: ${missingRoleSkills.slice(0, 4).join(', ')}.`
        : 'Good coverage of role-relevant skills.',
    ].filter(Boolean),
    suggestions,
    atsTips: [
      'List skills as keywords separated by commas or bullets, not long sentences.',
      'Use precise technology names (e.g. React, Node.js, AWS, SQL) rather than broad phrases.',
    ],
    roleTips: [`Use ${role} skills to improve keyword matching for ATS.`],
  };
};

const analyzeProjectsSection = (text) => {
  const lines = splitLines(text);
  const bullets = lines.filter((line) => line.match(/[-•·]/) || line.includes('project') || line.includes('developed'));
  const hasImpact = /\b(reduced|improved|increased|decreased|optimized|delivered|built|designed)\b/i.test(text);
  const suggestions = [];

  if (!text.trim()) {
    suggestions.push('Add a Projects section with at least one strong project bullet.');
  } else {
    if (!hasImpact) {
      suggestions.push('Add measurable impact statements like “reduced load time by 30%” or “improved performance”.');
    }
    if (bullets.length < 2) {
      suggestions.push('Use project bullets to explain what you built, how you built it, and the impact.');
    }
  }

  return {
    status: !text.trim() ? 'Missing' : hasImpact ? 'Good' : 'Needs Improvement',
    summary: text || '',
    feedback: [
      !text.trim() ? 'Projects section is missing.' : 'Projects section is detected.',
      hasImpact ? 'Good use of impact-oriented wording.' : 'Add measurable outcomes for your projects.',
    ].filter(Boolean),
    suggestions,
    atsTips: ['Mention technologies used and project outcomes clearly.', 'Use strong verbs such as built, developed, implemented, and deployed.'],
    roleTips: ['Highlight project relevance to the target role and domain.'],
  };
};

const analyzeEducationSection = (text) => {
  const hasDegree = /\b(b\.tech|bachelor|b\.e|m\.tech|master|degree|diploma)\b/i.test(text);
  const hasYear = /\b(20\d{2}|19\d{2})\b/.test(text);
  const hasGpa = /\b(cgpa|gpa|percentage|grade)\b/i.test(text);
  const suggestions = [];

  if (!text.trim()) {
    suggestions.push('Add an Education section with degree, institution, year, and CGPA or percentage.');
  } else {
    if (!hasDegree) suggestions.push('Include your degree or diploma name clearly in education entries.');
    if (!hasYear) suggestions.push('Add graduation year or expected completion year for clarity.');
    if (!hasGpa) suggestions.push('Add CGPA or percentage if applicable to strengthen the education section.');
  }

  return {
    status: !text.trim() ? 'Missing' : hasDegree && hasYear ? 'Good' : 'Needs Improvement',
    summary: text || '',
    feedback: [
      !text.trim() ? 'Education section is missing.' : 'Education section is present.',
      hasDegree && hasYear ? 'Education formatting appears consistent.' : 'Check education formatting for completeness.',
    ].filter(Boolean),
    suggestions,
    atsTips: ['List degree, institution name, years, and performance metrics clearly.', 'Keep education entries consistent and easy to scan.'],
    roleTips: ['If you have a strong CGPA or relevant coursework, include that in Education.'],
  };
};

const analyzeGenericSection = (text, title) => {
  const suggestions = [];
  if (!text.trim()) {
    suggestions.push(`Add a ${title} section to highlight relevant experience or achievements.`);
  } else {
    suggestions.push(`Frame ${title.toLowerCase()} with concise bullets, action words, and measurable outcomes.`);
  }

  return {
    status: !text.trim() ? 'Missing' : 'Good',
    summary: text || '',
    feedback: [!text.trim() ? `${title} section is missing.` : `${title} section is detected.`],
    suggestions,
    atsTips: [`Use clear category labels and concise bullet points in the ${title} section.`],
    roleTips: [`Connect ${title.toLowerCase()} to the target role with relevant examples.`],
  };
};

const getRoleOptions = () => Object.keys(ROLE_SKILLS_MAP);

export const analyzeResumeText = (text, studentSkills = [], role = 'Software Engineer') => {
  const lower = normalizeText(text).toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const sections = extractSections(text);
  const objectiveAnalysis = analyzeObjectiveSection(sections.objective, role, studentSkills);
  const skillsAnalysis = analyzeSkillsSection(sections.skills || sections.technicalSkills || '', role, studentSkills);
  const projectsAnalysis = analyzeProjectsSection(sections.projects || '');
  const educationAnalysis = analyzeEducationSection(sections.education || '');
  const experienceAnalysis = analyzeGenericSection(sections.experience || '', 'Experience');
  const internshipAnalysis = analyzeGenericSection(sections.internships || '', 'Internships');
  const certificationAnalysis = analyzeGenericSection(sections.certifications || '', 'Certifications');
  const achievementsAnalysis = analyzeGenericSection(sections.achievements || '', 'Achievements');
  const technicalAnalysis = analyzeSkillsSection(sections.technicalSkills || sections.skills || '', role, studentSkills);
  const softAnalysis = analyzeGenericSection(sections.softSkills || '', 'Soft Skills');

  const foundKeywords = [];
  const missingKeywords = [];
  PLACEMENT_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) foundKeywords.push(kw);
    else missingKeywords.push(kw);
  });
  studentSkills.forEach((skill) => {
    if (skill && lower.includes(skill.toLowerCase()) && !foundKeywords.includes(skill.toLowerCase())) {
      foundKeywords.push(skill.toLowerCase());
    }
  });

  // Professional, rarity-aligned scoring model.
  // Avoid casual 98/99/100 by requiring multiple “high-bar” signals.
  const sectionRatio = (st) => (st && st.status === 'Good' ? 1 : 0);

  const atsKeywordCoverage = PLACEMENT_KEYWORDS.length
    ? foundKeywords.filter((k) => PLACEMENT_KEYWORDS.includes(k)).length / PLACEMENT_KEYWORDS.length
    : 0;

  const roleKeywordCoverage = (ROLE_SKILLS_MAP[role] || []).length
    ? (ROLE_SKILLS_MAP[role] || []).filter((k) => lower.includes(String(k).toLowerCase())).length /
      (ROLE_SKILLS_MAP[role] || []).length
    : 0;

  const objectiveGood = objectiveAnalysis.status === 'Good' ? 1 : 0;
  const skillsGood = skillsAnalysis.status === 'Good' ? 1 : 0;
  const projectsGood = projectsAnalysis.status === 'Good' ? 1 : 0;
  const educationGood = educationAnalysis.status === 'Good' ? 1 : 0;
  const experienceGood = experienceAnalysis.status === 'Good' ? 1 : 0;
  const certGood = certificationAnalysis.status === 'Good' ? 1 : 0;
  const achievementsGood = achievementsAnalysis.status === 'Good' ? 1 : 0;

  const actionVerbDensity = ACTION_VERBS.length
    ? ACTION_VERBS.reduce((acc, v) => acc + (lower.includes(v) ? 1 : 0), 0) / ACTION_VERBS.length
    : 0;

  const hasProofMetrics = PROOF_METRICS.some((m) => new RegExp(`\\b${m}\\b`, 'i').test(text || '')) ? 1 : 0;
  const hasImpact = /\b(reduced|improved|increased|decreased|optimized|delivered|built|designed|implemented|automated|launched)\b/i.test(text || '')
    ? 1
    : 0;

  const contentCompletenessRatio =
    (sectionRatio(objectiveAnalysis) +
      sectionRatio(skillsAnalysis) +
      sectionRatio(projectsAnalysis) +
      sectionRatio(educationAnalysis) +
      sectionRatio(experienceAnalysis) +
      sectionRatio(certificationAnalysis) +
      sectionRatio(achievementsAnalysis)) /
    7;

  // Weighted score to 0..100, then enforce rarity gating near the top end.
  let rawScore = 0;
  rawScore += 35 * contentCompletenessRatio;
  rawScore += 25 * atsKeywordCoverage;
  rawScore += 15 * roleKeywordCoverage;
  rawScore += 10 * (0.5 * actionVerbDensity + 0.5 * (hasImpact ? 1 : 0));
  rawScore += 10 * (hasProofMetrics ? 1 : 0);
  rawScore += 5 * Math.min(1, words.length / 250);

  rawScore = clamp(rawScore, 0, 100);

  // Rarity gating: only allow 95+ when multiple hard signals are present.
  const highBarSignals = [
    objectiveGood,
    skillsGood,
    projectsGood,
    educationGood,
    hasImpact,
    hasProofMetrics,
    roleKeywordCoverage >= 0.6 ? 1 : 0,
    atsKeywordCoverage >= 0.55 ? 1 : 0,
  ];

  const highBarCount = highBarSignals.reduce((a, b) => a + (b ? 1 : 0), 0);

  let score = Math.round(rawScore);

  if (score >= 95 && highBarCount < 6) {
    score = 94; // prevent casual 98/99/100
  }

  // Also prevent “near top” inflation unless evidence exists.
  if (score >= 90 && highBarCount < 5) {
    score = Math.min(score, 89);
  }

  const grade = getGrade(score);


  // Replace suggestions should be evidence-driven (section text + role-specific rewrite).
  // Keep existing replaceSuggestions structure, but make sure rewrite text reflects role + detected content.
  const replaceSuggestions = [
    ...(
      objectiveAnalysis?.replaceSuggestions?.length
        ? objectiveAnalysis.replaceSuggestions
        : [sampleRewrite(sections.objective || sections.summary || 'N/A', objectiveAnalysis?.rewrite || generateObjectiveRewrite(sections.objective || sections.summary || '', role, studentSkills), 'Objective / Summary')]
    ),
    ...(() => {
      const items = [];

      const addEvidenceRewrite = ({ key, originalText, rewrite }) => {
        if (!rewrite) return;
        items.push({
          section: key,
          original: originalText || 'No content detected',
          improved: rewrite,
        });
      };

      // Skills: if missing role skills, propose a short keyword-first skills line.
      const missingForRole = (ROLE_SKILLS_MAP[role] || []).filter((k) => !lower.includes(String(k).toLowerCase()));
      if ((skillsAnalysis?.status && skillsAnalysis.status !== 'Good') || missingForRole.length) {
        const roleSkills = (ROLE_SKILLS_MAP[role] || []).slice(0, 6);
        const soft = SOFT_SKILLS.filter((s) => lower.includes(s) || true).slice(0, 2);
        const improved = `Technical Skills: ${roleSkills.join(', ')}\nSoft Skills: ${soft.join(', ')}`;
        addEvidenceRewrite({ key: 'Skills', originalText: sections.skills || sections.technicalSkills || '', rewrite: improved });
      }

      // Projects: if no proof metrics/impact, propose role-flavored bullet format.
      const hasProofMetrics = PROOF_METRICS.some((m) => new RegExp(`\\b${m}\\b`, 'i').test(text || ''));
      if (projectsAnalysis?.status !== 'Good' || !hasProofMetrics) {
        const roleDomainHint = (ROLE_SKILLS_MAP[role] || [role])[0];
        const improved = [
          `• Designed and built a ${role} project using ${roleDomainHint} with end-to-end functionality.`,
          `• Improved system performance (e.g., reduced latency / increased throughput) by applying optimization techniques.`,
          `• Automated workflows and documented results for maintainability and stakeholder clarity.`,
        ].join('\n');
        addEvidenceRewrite({ key: 'Projects', originalText: sections.projects || '', rewrite: improved });
      }

      // Education: if missing year/degree/cgpa, propose a consistent line format.
      const hasDegree = /\b(b\.tech|bachelor|b\.e|m\.tech|master|degree|diploma)\b/i.test(sections.education || '');
      const hasYear = /\b(20\d{2}|19\d{2})\b/.test(sections.education || '');
      const hasGpa = /\b(cgpa|gpa|percentage|grade)\b/i.test(sections.education || '');
      if (!hasDegree || !hasYear || !hasGpa) {
        const improved = `Education: <Degree>, <Institution>, <Year> (CGPA/GPA: <value>)`;
        addEvidenceRewrite({ key: 'Education', originalText: sections.education || '', rewrite: improved });
      }

      return items;
    })(),
  ];


  return {
    score,
    grade,
    foundKeywords: foundKeywords.slice(0, 15),
    suggestedKeywords: missingKeywords.slice(0, 12),
    feedback: [
      objectiveAnalysis.feedback[0],
      skillsAnalysis.feedback[0],
      educationAnalysis.feedback[0],
      projectsAnalysis.feedback[0],
    ].filter(Boolean),
    strengths: [
      objectiveAnalysis.status === 'Good' ? 'Strong objective statement' : null,
      skillsAnalysis.status === 'Good' ? 'Good skills coverage' : null,
      projectsAnalysis.status === 'Good' ? 'Projects are impact-driven' : null,
    ].filter(Boolean),
    improvements: [
      objectiveAnalysis.status !== 'Good' ? 'Improve the objective / summary' : null,
      skillsAnalysis.status !== 'Good' ? 'Enhance skills section with role-specific keywords' : null,
      educationAnalysis.status !== 'Good' ? 'Add complete education information' : null,
      projectsAnalysis.status !== 'Good' ? 'Clarify project impact and outcomes' : null,
    ].filter(Boolean),
    wordCount: words.length,
    sections: {
      objective: objectiveAnalysis,
      education: educationAnalysis,
      skills: skillsAnalysis,
      projects: projectsAnalysis,
      experience: experienceAnalysis,
      internships: internshipAnalysis,
      certifications: certificationAnalysis,
      achievements: achievementsAnalysis,
      technicalSkills: technicalAnalysis,
      softSkills: softAnalysis,
    },
    replaceSuggestions,
    selectedRole: role,
    aiPowered: false,
    recommendedRoleSkills: ROLE_SKILLS_MAP[role] || [],
  };
};

export const extractTextFromPdf = async (filePath) => {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch {
    return '';
  }
};

export const analyzeResumeWithAI = async (text, studentSkills = [], role = 'Software Engineer') => {
  const baseAnalysis = analyzeResumeText(text, studentSkills, role);

  if (!process.env.OPENAI_API_KEY || text.length < 50) {
    return baseAnalysis;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a resume reviewer that returns only valid JSON. Analyze the text and provide section-level guidance, status, feedback, suggestions, ATS tips, and rewrite recommendations for Objective, Skills, Projects, Education, Experience, Internships, Certifications, Achievements, Technical Skills, and Soft Skills.',
          },
          {
            role: 'user',
            content: `Target role: ${role}\nResume text:\n${text.slice(0, 3000)}`,
          },
        ],
        temperature: 0.25,
        max_tokens: 1200,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const aiResult = JSON.parse(content);
      return {
        ...baseAnalysis,
        ...aiResult,
        score: aiResult.score || baseAnalysis.score,
        aiPowered: true,
      };
    }
  } catch {
    // fallback to rule-based analysis
  }

  return baseAnalysis;
};


