// Calculate match percentage between Candidate skills and all Jobs
MATCH (c:Candidate {id: $candidateId})
MATCH (j:Job)-[:OFFERED_BY]->(comp:Company)
MATCH (j)-[:REQUIRES]->(reqSkill:Skill)
WITH c, j, comp, collect(DISTINCT reqSkill) AS allRequiredSkills, count(DISTINCT reqSkill) AS totalRequiredCount
OPTIONAL MATCH (c)-[:HAS_SKILL]->(candSkill:Skill)
WHERE candSkill IN allRequiredSkills
WITH j, comp, allRequiredSkills, totalRequiredCount, collect(DISTINCT candSkill) AS matchedSkillsList
WITH j, comp, allRequiredSkills, matchedSkillsList, totalRequiredCount, size(matchedSkillsList) AS matchedCount,
     round((toFloat(size(matchedSkillsList)) / toFloat(totalRequiredCount)) * 100) AS matchPercentage
RETURN 
  j,
  comp,
  matchedCount,
  totalRequiredCount,
  matchPercentage,
  [s IN matchedSkillsList | s.name] AS matchedSkillsNames,
  [s IN allRequiredSkills WHERE NOT s IN matchedSkillsList | s.name] AS missingSkillsNames
ORDER BY matchPercentage DESC, matchedCount DESC;

// MULTI-HOP QUERY (3-hop traversal: Candidate -> Project -> Skill -> Job)
// Finds jobs connected to skills demonstrated by candidate's built projects
MATCH (c:Candidate {id: $candidateId})
      -[:BUILT]->(p:Project)
      -[:USES_SKILL]->(s:Skill)
      <-[:REQUIRES]-(j:Job)
OPTIONAL MATCH (j)-[:OFFERED_BY]->(comp:Company)
RETURN 
  j.id AS jobId,
  j.title AS jobTitle,
  comp.name AS companyName,
  collect(DISTINCT p.name) AS projectNames,
  collect(DISTINCT s.name) AS demonstratedSkills,
  count(DISTINCT s) AS matchedSkillsCount
ORDER BY matchedSkillsCount DESC;
