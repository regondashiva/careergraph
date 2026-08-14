// Analyze missing skills for a specific candidate & job pair, and find courses that teach them
MATCH (c:Candidate {id: $candidateId})
MATCH (j:Job {id: $jobId})-[req:REQUIRES]->(reqSkill:Skill)
WHERE NOT (c)-[:HAS_SKILL]->(reqSkill)
OPTIONAL MATCH (crs:Course)-[:TEACHES]->(reqSkill)
RETURN 
  reqSkill AS skill,
  req.importance AS importance,
  req.requiredLevel AS requiredLevel,
  collect(DISTINCT crs) AS teachingCourses
ORDER BY 
  CASE req.importance WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, 
  reqSkill.name;

// Top missing skills across ALL open jobs for a candidate
MATCH (c:Candidate {id: $candidateId})
MATCH (j:Job)-[:REQUIRES]->(s:Skill)
WHERE NOT (c)-[:HAS_SKILL]->(s)
RETURN 
  s AS skill,
  count(DISTINCT j) AS demandingJobsCount,
  collect(DISTINCT j.title)[0..5] AS sampleJobTitles
ORDER BY demandingJobsCount DESC;
