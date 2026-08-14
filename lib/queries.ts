import { runQuery, sanitizeNeo4jValue } from './cognodb';
import {
  Candidate,
  Skill,
  Job,
  Company,
  Project,
  Course,
  Technology,
  CandidateSkillItem,
  JobMatchResult,
  SkillGapAnalysis,
  SkillGapItem,
  ProjectEvidence,
  LearningPathAnalysis,
  LearningPathStep,
  GraphData,
  GraphNode,
  GraphEdge,
} from './types';

// ==========================================
// 1. CANDIDATE QUERIES
// ==========================================

export async function getCandidates(): Promise<Candidate[]> {
  const cypher = `
    MATCH (c:Candidate)
    RETURN c
    ORDER BY c.name ASC
  `;
  const results = await runQuery<any>(cypher);
  return results
    .map((r: any) => r?.c || r)
    .filter((c: any) => Boolean(c && c.id));
}

export async function getCandidateById(candidateId: string): Promise<Candidate | null> {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})
    RETURN c
  `;
  const results = await runQuery<any>(cypher, { candidateId });
  if (results.length === 0) return null;
  const item = results[0]?.c || results[0];
  return item && item.id ? (item as Candidate) : null;
}

export async function getCandidateSkills(candidateId: string): Promise<CandidateSkillItem[]> {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})-[r:HAS_SKILL]->(s:Skill)
    RETURN s AS skill, r AS relationship
    ORDER BY s.name ASC
  `;
  const results = await runQuery<{ skill: Skill; relationship: any }>(cypher, { candidateId });
  return results.map((r) => ({
    skill: r.skill,
    relationship: {
      level: r.relationship.level || 'Intermediate',
      years: r.relationship.years || 1,
      lastUsed: r.relationship.lastUsed || 'Recent',
    },
  }));
}

export async function getCandidateProjects(candidateId: string): Promise<{ project: Project; skills: Skill[] }[]> {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})-[r:BUILT]->(p:Project)
    OPTIONAL MATCH (p)-[:USES_SKILL]->(s:Skill)
    RETURN p AS project, collect(s) AS skills
    ORDER BY p.name ASC
  `;
  const results = await runQuery<{ project: Project; skills: Skill[] }>(cypher, { candidateId });
  return results.map((r) => ({
    project: r.project,
    skills: (r.skills || []).filter(Boolean),
  }));
}

export async function getCandidateOverview(candidateId: string) {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})
    OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
    OPTIONAL MATCH (c)-[:BUILT]->(p:Project)
    OPTIONAL MATCH (c)-[:COMPLETED]->(crs:Course)
    RETURN 
      c AS candidate,
      count(DISTINCT s) AS skillCount,
      count(DISTINCT p) AS projectCount,
      count(DISTINCT crs) AS completedCourseCount
  `;
  const results = await runQuery(cypher, { candidateId });
  if (results.length === 0) return null;
  return {
    candidate: results[0].candidate as Candidate,
    skillCount: Number(results[0].skillCount || 0),
    projectCount: Number(results[0].projectCount || 0),
    completedCourseCount: Number(results[0].completedCourseCount || 0),
  };
}

// ==========================================
// 2. JOB & MATCHING QUERIES
// ==========================================

export async function getAllJobs(): Promise<Job[]> {
  const cypher = `
    MATCH (j:Job)
    OPTIONAL MATCH (j)-[:OFFERED_BY]->(comp:Company)
    RETURN j, comp.name AS companyName, comp.id AS companyId
    ORDER BY j.postedAt DESC
  `;
  const results = await runQuery<{ j: Job; companyName?: string; companyId?: string }>(cypher);
  return results.map((r) => ({
    ...r.j,
    companyName: r.companyName,
    companyId: r.companyId,
  }));
}

export async function getJobById(jobId: string): Promise<{ job: Job; company: Company | null; requiredSkills: { skill: Skill; importance: string; requiredLevel: string }[]; technologies: Technology[] } | null> {
  const cypher = `
    MATCH (j:Job {id: $jobId})
    OPTIONAL MATCH (j)-[:OFFERED_BY]->(comp:Company)
    OPTIONAL MATCH (j)-[req:REQUIRES]->(s:Skill)
    OPTIONAL MATCH (j)-[:USES]->(tech:Technology)
    RETURN 
      j AS job,
      comp AS company,
      collect(DISTINCT { skill: s, importance: req.importance, requiredLevel: req.requiredLevel }) AS reqSkills,
      collect(DISTINCT tech) AS technologies
  `;
  const results = await runQuery(cypher, { jobId });
  if (results.length === 0 || !results[0].job) return null;

  const row = results[0];
  const requiredSkills = (row.reqSkills || [])
    .filter((item: any) => item && item.skill && item.skill.id)
    .map((item: any) => ({
      skill: item.skill,
      importance: item.importance || 'HIGH',
      requiredLevel: item.requiredLevel || 'Intermediate',
    }));

  return {
    job: row.job as Job,
    company: row.company ? (row.company as Company) : null,
    requiredSkills,
    technologies: (row.technologies || []).filter(Boolean),
  };
}

/**
 * JOB MATCHING QUERY
 * Compares candidate skills against job requirements dynamically using openCypher
 */
export async function getJobRecommendations(candidateId: string): Promise<JobMatchResult[]> {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})
    MATCH (j:Job)-[:OFFERED_BY]->(comp:Company)
    MATCH (j)-[:REQUIRES]->(reqSkill:Skill)
    WITH c, j, comp, collect(DISTINCT reqSkill) AS allRequiredSkills, count(DISTINCT reqSkill) AS totalRequiredCount
    
    OPTIONAL MATCH (c)-[:HAS_SKILL]->(candSkill:Skill)
    WHERE candSkill IN allRequiredSkills
    WITH j, comp, allRequiredSkills, totalRequiredCount, collect(DISTINCT candSkill) AS matchedSkillsList
    
    WITH j, comp, allRequiredSkills, matchedSkillsList, totalRequiredCount, size(matchedSkillsList) AS matchedCount,
         CASE WHEN totalRequiredCount > 0 
              THEN round((toFloat(size(matchedSkillsList)) / toFloat(totalRequiredCount)) * 100) 
              ELSE 0 END AS matchPercentage
              
    RETURN 
      j AS job,
      comp AS company,
      totalRequiredCount,
      matchedCount,
      matchPercentage,
      matchedSkillsList AS matchingSkillsDetail,
      [s IN allRequiredSkills WHERE NOT s IN matchedSkillsList] AS missingSkillsDetail
    ORDER BY matchPercentage DESC, matchedCount DESC
  `;

  const results = await runQuery(cypher, { candidateId });
  return results.map((r: any) => {
    const matchingSkills = (r.matchingSkillsDetail || []).filter(Boolean);
    const missingSkills = (r.missingSkillsDetail || []).filter(Boolean);
    return {
      job: r.job as Job,
      company: r.company as Company,
      matchedSkills: matchingSkills.map((s: Skill) => s.name),
      missingSkills: missingSkills.map((s: Skill) => s.name),
      totalRequiredCount: Number(r.totalRequiredCount || 0),
      matchedCount: Number(r.matchedCount || 0),
      matchPercentage: Number(r.matchPercentage || 0),
      matchingSkillsDetail: matchingSkills,
      missingSkillsDetail: missingSkills,
    };
  });
}

// ==========================================
// 3. MULTI-HOP TRAVERSAL & EVIDENCE QUERIES
// ==========================================

/**
 * MULTI-HOP QUERY (Candidate -> BUILT -> Project -> USES_SKILL -> Skill <- REQUIRES - Job)
 * Finds jobs connected to skills demonstrated by projects built by a candidate.
 */
export async function getMultiHopProjectMatches(candidateId: string) {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})
          -[:BUILT]->(p:Project)
          -[:USES_SKILL]->(s:Skill)
          <-[:REQUIRES]-(j:Job)
    OPTIONAL MATCH (j)-[:OFFERED_BY]->(comp:Company)
    RETURN 
      j.id AS jobId,
      j.title AS jobTitle,
      comp.name AS companyName,
      collect(DISTINCT p.name) AS demonstratedProjects,
      collect(DISTINCT s.name) AS demonstratedSkills,
      count(DISTINCT s) AS matchedSkillsCount
    ORDER BY matchedSkillsCount DESC
  `;
  return await runQuery(cypher, { candidateId });
}

/**
 * PROJECT EVIDENCE QUERY
 * Shows projects built by candidate that explicitly demonstrate skills required by a specific target job.
 */
export async function getProjectEvidenceForJob(candidateId: string, jobId: string): Promise<ProjectEvidence[]> {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})-[:BUILT]->(p:Project)-[:USES_SKILL]->(s:Skill)<-[:REQUIRES]-(j:Job {id: $jobId})
    RETURN 
      p AS project,
      collect(DISTINCT s) AS demonstratedSkills,
      count(DISTINCT s) AS matchingJobSkillsCount
    ORDER BY matchingJobSkillsCount DESC
  `;
  const results = await runQuery(cypher, { candidateId, jobId });
  return results.map((r: any) => ({
    project: r.project as Project,
    demonstratedSkills: (r.demonstratedSkills || []).filter(Boolean),
    matchingJobSkillsCount: Number(r.matchingJobSkillsCount || 0),
  }));
}

// ==========================================
// 4. SKILL GAP & LEARNING PATH QUERIES
// ==========================================

/**
 * SKILL GAP QUERY
 * Returns missing required skills for candidate on a job, along with courses that teach those missing skills.
 */
export async function getSkillGapAnalysis(candidateId: string, jobId: string): Promise<SkillGapAnalysis | null> {
  const jobDetail = await getJobById(jobId);
  if (!jobDetail) return null;

  const cypher = `
    MATCH (c:Candidate {id: $candidateId})
    MATCH (j:Job {id: $jobId})-[req:REQUIRES]->(reqSkill:Skill)
    WITH c, j, req, reqSkill
    OPTIONAL MATCH (c)-[h:HAS_SKILL]->(reqSkill)
    WITH c, j, req, reqSkill, (h IS NOT NULL) AS isPossessed
    
    OPTIONAL MATCH (crs:Course)-[:TEACHES]->(reqSkill)
    
    RETURN 
      reqSkill AS skill,
      req.importance AS importance,
      req.requiredLevel AS requiredLevel,
      isPossessed,
      collect(DISTINCT crs) AS teachingCourses
    ORDER BY isPossessed ASC, req.importance DESC, reqSkill.name ASC
  `;

  const results = await runQuery(cypher, { candidateId, jobId });

  const matchedSkills: Skill[] = [];
  const missingSkills: SkillGapItem[] = [];

  results.forEach((row: any) => {
    if (!row.skill) return;
    if (row.isPossessed) {
      matchedSkills.push(row.skill as Skill);
    } else {
      missingSkills.push({
        skill: row.skill as Skill,
        importance: row.importance || 'HIGH',
        requiredLevel: row.requiredLevel || 'Intermediate',
        teachingCourses: (row.teachingCourses || []).filter(Boolean),
      });
    }
  });

  const totalReq = matchedSkills.length + missingSkills.length;
  const matchPct = totalReq > 0 ? Math.round((matchedSkills.length / totalReq) * 100) : 0;

  return {
    candidateId,
    jobId,
    jobTitle: jobDetail.job.title,
    companyName: jobDetail.company?.name,
    matchPercentage: matchPct,
    matchedSkills,
    missingSkills,
  };
}

export async function getTopMissingSkillsAcrossJobs(candidateId: string): Promise<{ skill: Skill; demandingJobsCount: number; sampleJobTitles: string[] }[]> {
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})
    MATCH (j:Job)-[:REQUIRES]->(s:Skill)
    WHERE NOT (c)-[:HAS_SKILL]->(s)
    RETURN 
      s AS skill,
      count(DISTINCT j) AS demandingJobsCount,
      collect(DISTINCT j.title)[0..5] AS sampleJobTitles
    ORDER BY demandingJobsCount DESC
    LIMIT 10
  `;
  const results = await runQuery(cypher, { candidateId });
  return results.map((r: any) => ({
    skill: r.skill as Skill,
    demandingJobsCount: Number(r.demandingJobsCount || 0),
    sampleJobTitles: r.sampleJobTitles || [],
  }));
}

/**
 * CAREER & LEARNING PATH QUERY
 * Traverses Skill -> PREREQUISITE_OF -> Skill to build prerequisite learning paths for missing job skills.
 */
export async function getLearningPath(candidateId: string, targetJobId: string): Promise<LearningPathAnalysis | null> {
  const jobDetail = await getJobById(targetJobId);
  if (!jobDetail) return null;

  const gapAnalysis = await getSkillGapAnalysis(candidateId, targetJobId);
  if (!gapAnalysis) return null;

  const candidateSkills = await getCandidateSkills(candidateId);
  const possessedSkillIds = new Set(candidateSkills.map((cs) => cs.skill.id));

  // Traversal to find prerequisite chains for target missing skills
  const cypher = `
    MATCH (c:Candidate {id: $candidateId})
    MATCH (j:Job {id: $jobId})-[:REQUIRES]->(targetSkill:Skill)
    WHERE NOT (c)-[:HAS_SKILL]->(targetSkill)
    
    OPTIONAL MATCH path = (prereq:Skill)-[:PREREQUISITE_OF*1..3]->(targetSkill)
    OPTIONAL MATCH (crs:Course)-[:TEACHES]->(targetSkill)
    OPTIONAL MATCH (prereqCrs:Course)-[:TEACHES]->(prereq)
    
    RETURN 
      targetSkill AS skill,
      collect(DISTINCT prereq) AS prerequisites,
      collect(DISTINCT crs) AS targetCourses,
      collect(DISTINCT prereqCrs) AS prereqCourses
  `;

  const results = await runQuery(cypher, { candidateId, jobId: targetJobId });

  const pathSteps: LearningPathStep[] = [];
  const processedSkills = new Set<string>();

  // First process prerequisites
  results.forEach((row: any) => {
    const targetSkill = row.skill as Skill;
    if (!targetSkill) return;

    const prereqs = (row.prerequisites || []).filter(Boolean) as Skill[];
    prereqs.forEach((pSkill) => {
      if (!processedSkills.has(pSkill.id)) {
        processedSkills.add(pSkill.id);
        const isPossessed = possessedSkillIds.has(pSkill.id);
        pathSteps.push({
          stepIndex: pathSteps.length + 1,
          skill: pSkill,
          status: isPossessed ? 'possessed' : 'missing',
          prerequisiteFor: [targetSkill.name],
          recommendedCourses: (row.prereqCourses || []).filter(Boolean),
        });
      }
    });

    if (!processedSkills.has(targetSkill.id)) {
      processedSkills.add(targetSkill.id);
      pathSteps.push({
        stepIndex: pathSteps.length + 1,
        skill: targetSkill,
        status: 'target',
        recommendedCourses: (row.targetCourses || []).filter(Boolean),
      });
    }
  });

  return {
    candidateId,
    targetJob: jobDetail.job,
    pathSteps,
  };
}

// ==========================================
// 5. GRAPH VISUALIZATION SUBGRAPH QUERIES
// ==========================================

/**
 * Returns dynamic nodes and edges for visual rendering in Graph Explorer.
 */
export async function getGraphDataForEntity(centerId: string, entityType: 'Candidate' | 'Job' | 'Skill' | 'Company' | 'All' = 'All'): Promise<GraphData> {
  let cypher = '';
  let params: Record<string, any> = { centerId };
  let description = '';

  if (entityType === 'Candidate') {
    description = `3-hop neighborhood surrounding Candidate (${centerId}): Candidate -> Skills, Projects, Courses, and matching Jobs`;
    cypher = `
      MATCH path = (c:Candidate {id: $centerId})-[r1:HAS_SKILL|BUILT|COMPLETED]->(m)
      OPTIONAL MATCH secondHop = (m)-[r2:USES_SKILL|USES_TECHNOLOGY|REQUIRES|OFFERED_BY|TEACHES]->(n)
      RETURN nodes(path) + coalesce(nodes(secondHop), []) AS nodesList,
             relationships(path) + coalesce(relationships(secondHop), []) AS relsList
      LIMIT 120
    `;
  } else if (entityType === 'Job') {
    description = `2-hop neighborhood surrounding Job (${centerId}): Job -> Company, Required Skills, Technologies, and Demonstrating Projects/Candidates`;
    cypher = `
      MATCH path = (j:Job {id: $centerId})-[r1:OFFERED_BY|REQUIRES|USES]->(m)
      OPTIONAL MATCH secondHop = (m)<-[r2:USES_SKILL|BUILT|HAS_SKILL|TEACHES]-(n)
      RETURN nodes(path) + coalesce(nodes(secondHop), []) AS nodesList,
             relationships(path) + coalesce(relationships(secondHop), []) AS relsList
      LIMIT 120
    `;
  } else if (entityType === 'Skill') {
    description = `Connections around Skill (${centerId}): Candidate HAS_SKILL, Job REQUIRES, Project USES_SKILL, Course TEACHES, Skill PREREQUISITE_OF`;
    cypher = `
      MATCH path = (s:Skill {id: $centerId})-[r1]-(m)
      RETURN nodes(path) AS nodesList, relationships(path) AS relsList
      LIMIT 100
    `;
  } else {
    // Default Subgraph sample
    description = `Core CareerGraph Subgraph: Sample Candidates, Skills, Projects, Jobs, and Companies`;
    cypher = `
      MATCH (c:Candidate {id: 'candidate-001'})-[r1:HAS_SKILL|BUILT]->(m)
      OPTIONAL MATCH (m)-[r2:REQUIRES|USES_SKILL]->(j:Job)
      OPTIONAL MATCH (j)-[r3:OFFERED_BY]->(comp:Company)
      WITH collect(c) + collect(m) + collect(j) + collect(comp) AS allNodes,
           collect(r1) + collect(r2) + collect(r3) AS allRels
      RETURN allNodes AS nodesList, allRels AS relsList
    `;
  }

  const results = await runQuery(cypher, params);

  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  results.forEach((row: any) => {
    const nodesList = row.nodesList || [];
    const relsList = row.relsList || [];

    nodesList.forEach((rawNode: any) => {
      if (!rawNode) return;
      const sanitized = sanitizeNeo4jValue(rawNode);
      const id = sanitized.id || String(sanitized._id);
      const label = sanitized.name || sanitized.title || id;
      const type = (sanitized._labels && sanitized._labels[0]) || 'Skill';

      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          label,
          type: type as any,
          properties: sanitized,
        });
      }
    });

    relsList.forEach((rawRel: any) => {
      if (!rawRel) return;
      const rel = sanitizeNeo4jValue(rawRel);
      // Neo4j relationships may have start/end node identity properties
      const source = rel.startNodeId || rel._startNodeId || rel._source;
      const target = rel.endNodeId || rel._endNodeId || rel._target;
      const edgeId = `${source}->${target}:${rel._type || 'CONNECTED'}`;

      if (!edgeMap.has(edgeId) && source && target) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source: String(source),
          target: String(target),
          label: rel._type || 'RELATED',
          properties: rel,
        });
      }
    });
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    queryMetadata: {
      cypherQuery: cypher.trim(),
      hopCount: entityType === 'Candidate' ? 3 : 2,
      description,
    },
  };
}

// ==========================================
// 6. COMPANY QUERIES
// ==========================================

export async function getCompaniesList(): Promise<Company[]> {
  const cypher = `
    MATCH (comp:Company)
    RETURN comp
    ORDER BY comp.name ASC
  `;
  const results = await runQuery<any>(cypher);
  return results
    .map((r: any) => r?.comp || r)
    .filter((c: any) => Boolean(c && c.id));
}

export async function getCompanyDetails(companyId: string): Promise<{ company: Company; openJobs: Job[]; topRequiredSkills: Skill[] } | null> {
  const cypher = `
    MATCH (comp:Company {id: $companyId})
    OPTIONAL MATCH (j:Job)-[:OFFERED_BY]->(comp)
    OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)
    RETURN 
      comp AS company,
      collect(DISTINCT j) AS jobs,
      collect(DISTINCT s) AS skills
  `;
  const results = await runQuery(cypher, { companyId });
  if (results.length === 0 || !results[0].company) return null;

  return {
    company: results[0].company as Company,
    openJobs: (results[0].jobs || []).filter(Boolean),
    topRequiredSkills: (results[0].skills || []).filter(Boolean),
  };
}
