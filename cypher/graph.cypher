// Get visual graph neighborhood centered on a Candidate (up to 3 hops)
MATCH path = (c:Candidate {id: $candidateId})-[*1..3]-(m)
WHERE labels(m)[0] IN ['Skill', 'Project', 'Job', 'Company', 'Course', 'Technology']
RETURN nodes(path) AS nodes, relationships(path) AS rels
LIMIT 100;

// Project evidence traversal (Candidate -> BUILT -> Project -> USES_SKILL -> Skill <- REQUIRES - Job)
MATCH path = (c:Candidate {id: $candidateId})-[:BUILT]->(p:Project)-[:USES_SKILL]->(s:Skill)<-[:REQUIRES]-(j:Job {id: $jobId})
OPTIONAL MATCH compPath = (j)-[:OFFERED_BY]->(comp:Company)
RETURN nodes(path) + coalesce(nodes(compPath), []) AS nodes, relationships(path) + coalesce(relationships(compPath), []) AS rels;

// Skill Prerequisite Path Traversal (Skill -> PREREQUISITE_OF*1..3 -> Skill)
MATCH path = (startSkill:Skill)-[:PREREQUISITE_OF*1..4]->(targetSkill:Skill)<-[:REQUIRES]-(j:Job {id: $jobId})
RETURN path;
