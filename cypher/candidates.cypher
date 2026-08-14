// Fetch a specific candidate by ID
MATCH (c:Candidate {id: $candidateId})
RETURN c;

// Fetch all skills possessed by a candidate
MATCH (c:Candidate {id: $candidateId})-[r:HAS_SKILL]->(s:Skill)
RETURN s, r
ORDER BY s.name;

// Fetch all projects built by a candidate with demonstrated skills
MATCH (c:Candidate {id: $candidateId})-[r:BUILT]->(p:Project)
OPTIONAL MATCH (p)-[:USES_SKILL]->(s:Skill)
RETURN p, r, collect(s) AS skills
ORDER BY p.name;

// Fetch candidate profile with summary counts
MATCH (c:Candidate {id: $candidateId})
OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
OPTIONAL MATCH (c)-[:BUILT]->(p:Project)
OPTIONAL MATCH (c)-[:COMPLETED]->(crs:Course)
RETURN 
  c, 
  count(DISTINCT s) AS skillCount, 
  count(DISTINCT p) AS projectCount,
  count(DISTINCT crs) AS completedCourseCount;
