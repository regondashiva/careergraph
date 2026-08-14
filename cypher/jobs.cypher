// List all jobs with their offered company
MATCH (j:Job)-[:OFFERED_BY]->(comp:Company)
OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)
RETURN j, comp, collect(DISTINCT s.name) AS requiredSkills
ORDER BY j.postedAt DESC;

// Fetch detailed job info by ID including required skills and technologies
MATCH (j:Job {id: $jobId})
OPTIONAL MATCH (j)-[:OFFERED_BY]->(comp:Company)
OPTIONAL MATCH (j)-[req:REQUIRES]->(s:Skill)
OPTIONAL MATCH (j)-[:USES]->(tech:Technology)
RETURN 
  j, 
  comp, 
  collect(DISTINCT { skill: s, importance: req.importance, requiredLevel: req.requiredLevel }) AS requiredSkillsDetail,
  collect(DISTINCT tech) AS technologies;
