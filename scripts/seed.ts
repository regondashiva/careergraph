import neo4j, { Driver } from 'neo4j-driver';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          if (key) {
            process.env[key.trim()] = vals.join('=').trim();
          }
        }
      });
    }
  }
}
loadEnv();

const URI = process.env.COGNODB_URI || 'bolt://localhost:7687';
const USER = process.env.COGNODB_USERNAME || 'cognodb';
const PASSWORD = process.env.COGNODB_PASSWORD || 'cognodb_secret_password';

async function runSeed() {
  console.log('----------------------------------------------------');
  console.log('🚀 CareerGraph Seed Script — CognoDB / openCypher');
  console.log(`Connecting to: ${URI} as user: ${USER}`);
  console.log('----------------------------------------------------');

  const driver: Driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  try {
    // 1. Verify Connectivity
    await session.run('RETURN 1');
    console.log('✅ Connected to CognoDB graph database!');

    // 2. Setup Uniqueness Constraints & Indexes
    console.log('⚙️ Creating constraints and indexes...');
    const constraintLabels = [
      'Candidate', 'Skill', 'Job', 'Company', 'Project', 'Course', 'Technology'
    ];
    for (const label of constraintLabels) {
      try {
        await session.run(`CREATE CONSTRAINT ${label.toLowerCase()}_id_unique IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`);
      } catch (err: any) {
        // Fallback for older Cypher syntax if needed
        try {
          await session.run(`CREATE INDEX IF NOT EXISTS FOR (n:${label}) ON (n.id)`);
        } catch (_) {}
      }
    }

    // 3. Clear existing demo nodes safely if requested
    console.log('🧹 Clearing existing demo data...');
    await session.run('MATCH (n) DETACH DELETE n');

    // 4. Create Companies
    console.log('🏢 Seeding Companies...');
    const companies = [
      { id: 'company-001', name: 'Wexa AI', industry: 'Artificial Intelligence', location: 'Hyderabad', companySize: '50-200', website: 'https://wexa.ai', description: 'Next-gen enterprise AI & Graph Automation platform.' },
      { id: 'company-002', name: 'Microsoft', industry: 'Cloud & Software', location: 'Hyderabad / Seattle', companySize: '100,000+', website: 'https://microsoft.com', description: 'Empowering every person and organization to achieve more.' },
      { id: 'company-003', name: 'Google', industry: 'Technology & Search', location: 'Bengaluru / Mountain View', companySize: '100,000+', website: 'https://google.com', description: 'Organizing the world’s information and making it universally accessible.' },
      { id: 'company-004', name: 'Amazon Web Services', industry: 'Cloud Infrastructure', location: 'Bengaluru / Seattle', companySize: '100,000+', website: 'https://aws.amazon.com', description: 'World leading cloud platform offering 200+ fully featured services.' },
      { id: 'company-005', name: 'Deloitte', industry: 'Consulting & Technology', location: 'Hyderabad', companySize: '50,000+', website: 'https://deloitte.com', description: 'Global leader in audit, consulting, advisory, and tax services.' },
      { id: 'company-006', name: 'TCS', industry: 'IT Services', location: 'Mumbai / Hyderabad', companySize: '500,000+', website: 'https://tcs.com', description: 'Global IT service, consulting, and business solutions leader.' },
      { id: 'company-007', name: 'Infosys', industry: 'IT Services & AI', location: 'Bengaluru', companySize: '300,000+', website: 'https://infosys.com', description: 'Next-generation digital services and consulting.' },
      { id: 'company-008', name: 'Accenture', industry: 'Technology Consulting', location: 'Bengaluru', companySize: '500,000+', website: 'https://accenture.com', description: 'Global professional services company with leading digital capabilities.' },
      { id: 'company-009', name: 'Zomato AI', industry: 'Consumer Tech / FoodTech', location: 'Gurugram', companySize: '5,000+', website: 'https://zomato.com', description: 'Pioneering quick commerce and AI delivery optimization.' },
      { id: 'company-010', name: 'Razorpay', industry: 'Fintech', location: 'Bengaluru', companySize: '3,000+', website: 'https://razorpay.com', description: 'Full-stack financial services platform powering Indian tech startups.' }
    ];

    for (const c of companies) {
      await session.run(`
        MERGE (comp:Company {id: $id})
        SET comp += $props
      `, { id: c.id, props: c });
    }

    // 5. Create Skills
    console.log('💡 Seeding Skills...');
    const skills = [
      // Programming & Core
      { id: 'skill-python', name: 'Python', category: 'Programming', difficulty: 'Beginner', description: 'High-level programming language for web, AI, data science, and scripting.' },
      { id: 'skill-javascript', name: 'JavaScript', category: 'Programming', difficulty: 'Beginner', description: 'Dynamic language powering modern web applications.' },
      { id: 'skill-typescript', name: 'TypeScript', category: 'Programming', difficulty: 'Intermediate', description: 'Typed superset of JavaScript that compiles to plain JS.' },
      { id: 'skill-cpp', name: 'C++', category: 'Programming', difficulty: 'Advanced', description: 'Performance-critical systems programming language.' },
      
      // Frontend
      { id: 'skill-react', name: 'React', category: 'Frontend', difficulty: 'Intermediate', description: 'Component-based UI library for building interactive interfaces.' },
      { id: 'skill-nextjs', name: 'Next.js', category: 'Frontend', difficulty: 'Intermediate', description: 'React framework for server-rendered and full-stack web applications.' },
      { id: 'skill-tailwindcss', name: 'Tailwind CSS', category: 'Frontend', difficulty: 'Beginner', description: 'Utility-first CSS framework for rapid UI development.' },
      { id: 'skill-vue', name: 'Vue.js', category: 'Frontend', difficulty: 'Intermediate', description: 'Progressive JavaScript framework for user interfaces.' },

      // Backend
      { id: 'skill-nodejs', name: 'Node.js', category: 'Backend', difficulty: 'Intermediate', description: 'Asynchronous event-driven JavaScript runtime engine.' },
      { id: 'skill-express', name: 'Express.js', category: 'Backend', difficulty: 'Beginner', description: 'Fast, unopinionated minimal web framework for Node.js.' },
      { id: 'skill-fastapi', name: 'FastAPI', category: 'Backend', difficulty: 'Intermediate', description: 'Modern, fast web framework for building APIs with Python.' },
      { id: 'skill-graphql', name: 'GraphQL', category: 'Backend', difficulty: 'Intermediate', description: 'Query language for APIs and runtime for fulfilling queries.' },
      
      // Database & Graph
      { id: 'skill-sql', name: 'SQL', category: 'Database', difficulty: 'Beginner', description: 'Relational database querying and management language.' },
      { id: 'skill-postgresql', name: 'PostgreSQL', category: 'Database', difficulty: 'Intermediate', description: 'Advanced open-source relational database system.' },
      { id: 'skill-mongodb', name: 'MongoDB', category: 'Database', difficulty: 'Intermediate', description: 'Document-based NoSQL database engine.' },
      { id: 'skill-cypher', name: 'Cypher / openCypher', category: 'Database', difficulty: 'Intermediate', description: 'Declarative graph query language for CognoDB and Neo4j.' },
      { id: 'skill-neo4j', name: 'Neo4j / CognoDB', category: 'Database', difficulty: 'Intermediate', description: 'Enterprise graph database platform for relationship-rich data.' },

      // AI/ML
      { id: 'skill-ml', name: 'Machine Learning', category: 'AI/ML', difficulty: 'Intermediate', description: 'Algorithms and mathematical models that learn from data.' },
      { id: 'skill-pytorch', name: 'PyTorch', category: 'AI/ML', difficulty: 'Advanced', description: 'Open-source deep learning framework based on Torch.' },
      { id: 'skill-tensorflow', name: 'TensorFlow', category: 'AI/ML', difficulty: 'Advanced', description: 'End-to-end open-source machine learning platform.' },
      { id: 'skill-deeplearning', name: 'Deep Learning', category: 'AI/ML', difficulty: 'Advanced', description: 'Neural network architectures for speech, vision, and NLP.' },
      { id: 'skill-computervision', name: 'Computer Vision', category: 'AI/ML', difficulty: 'Advanced', description: 'Visual data processing, object detection, and image analysis.' },
      { id: 'skill-nlp', name: 'Natural Language Processing', category: 'AI/ML', difficulty: 'Advanced', description: 'Text processing, LLM fine-tuning, and language modeling.' },
      { id: 'skill-pandas', name: 'Pandas', category: 'Data', difficulty: 'Beginner', description: 'Python data analysis and manipulation toolkit.' },

      // Cloud & DevOps
      { id: 'skill-docker', name: 'Docker', category: 'DevOps', difficulty: 'Intermediate', description: 'Platform for containerizing applications and microservices.' },
      { id: 'skill-kubernetes', name: 'Kubernetes', category: 'DevOps', difficulty: 'Advanced', description: 'Production-grade container orchestration system.' },
      { id: 'skill-aws', name: 'AWS', category: 'Cloud', difficulty: 'Intermediate', description: 'Comprehensive cloud computing services suite.' },
      { id: 'skill-git', name: 'Git', category: 'Tools', difficulty: 'Beginner', description: 'Distributed version control system.' }
    ];

    for (const s of skills) {
      await session.run(`
        MERGE (sk:Skill {id: $id})
        SET sk += $props
      `, { id: s.id, props: s });
    }

    // 6. Create Technologies
    console.log('🛠️ Seeding Technologies...');
    const technologies = [
      { id: 'tech-nextjs', name: 'Next.js', category: 'Framework' },
      { id: 'tech-react', name: 'React', category: 'Frontend Library' },
      { id: 'tech-nodejs', name: 'Node.js', category: 'Runtime' },
      { id: 'tech-fastapi', name: 'FastAPI', category: 'Backend Framework' },
      { id: 'tech-postgresql', name: 'PostgreSQL', category: 'Database' },
      { id: 'tech-cognodb', name: 'CognoDB', category: 'Graph Database' },
      { id: 'tech-docker', name: 'Docker', category: 'DevOps' },
      { id: 'tech-pytorch', name: 'PyTorch', category: 'AI Library' },
      { id: 'tech-aws', name: 'AWS Lambda', category: 'Cloud Serverless' },
      { id: 'tech-opencv', name: 'OpenCV', category: 'Computer Vision' }
    ];

    for (const t of technologies) {
      await session.run(`
        MERGE (tech:Technology {id: $id})
        SET tech += $props
      `, { id: t.id, props: t });
    }

    // 7. Create Candidates
    console.log('👤 Seeding Candidates...');
    const candidates = [
      {
        id: 'candidate-001',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        location: 'Hyderabad',
        experienceYears: 1,
        headline: 'Full Stack & AI Developer',
        bio: 'Passionate software engineer building web applications and AI tools with Next.js, Python, and Graph Databases.'
      },
      {
        id: 'candidate-002',
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        location: 'Bengaluru',
        experienceYears: 3,
        headline: 'Senior AI Engineer',
        bio: 'Focused on deep learning models, LLM pipelines, and computer vision deployment in production.'
      },
      {
        id: 'candidate-003',
        name: 'Marcus Vance',
        email: 'marcus.v@example.com',
        location: 'Hyderabad',
        experienceYears: 2,
        headline: 'Backend & Cloud Developer',
        bio: 'Specialist in high-throughput distributed systems, Node.js microservices, PostgreSQL, and AWS.'
      },
      {
        id: 'candidate-004',
        name: 'Priya Patel',
        email: 'priya.p@example.com',
        location: 'Pune',
        experienceYears: 1,
        headline: 'Frontend Engineer',
        bio: 'Design-driven UI engineer obsessed with micro-interactions, Next.js, React, and performance.'
      },
      {
        id: 'candidate-005',
        name: 'David Kim',
        email: 'david.kim@example.com',
        location: 'Remote / Delhi',
        experienceYears: 4,
        headline: 'Data Scientist & Graph Architect',
        bio: 'Loves connected data, Cypher queries, graph algorithms, and predictive ML models.'
      }
    ];

    for (const cand of candidates) {
      await session.run(`
        MERGE (c:Candidate {id: $id})
        SET c += $props
      `, { id: cand.id, props: cand });
    }

    // 8. Create Projects
    console.log('📁 Seeding Projects...');
    const projects = [
      {
        id: 'project-001',
        name: 'AI Resume Screening System',
        description: 'Automated candidate portfolio match engine using NLP embeddings and Python ML algorithms.',
        category: 'AI/ML & Web',
        difficulty: 'Intermediate',
        githubUrl: 'https://github.com/alex/ai-resume-screening'
      },
      {
        id: 'project-002',
        name: 'SmartCart AI',
        description: 'Computer vision powered real-time checkout system with visual product recognition.',
        category: 'Computer Vision',
        difficulty: 'Advanced',
        githubUrl: 'https://github.com/alex/smartcart-ai'
      },
      {
        id: 'project-003',
        name: 'Career Recommendation Platform',
        description: 'Relationship-heavy career graph explorer using openCypher, CognoDB, Next.js, and TypeScript.',
        category: 'Full Stack & Graph',
        difficulty: 'Advanced',
        githubUrl: 'https://github.com/alex/career-recommendation-platform'
      },
      {
        id: 'project-004',
        name: 'Hostel Connect',
        description: 'Real-time room allocation and maintenance ticketing platform for university campus logistics.',
        category: 'Web App',
        difficulty: 'Beginner',
        githubUrl: 'https://github.com/alex/hostel-connect'
      },
      {
        id: 'project-005',
        name: 'IoT Energy Automation',
        description: 'Smart grid telemetry pipeline capturing device consumption metrics over WebSockets.',
        category: 'DevOps & Systems',
        difficulty: 'Intermediate',
        githubUrl: 'https://github.com/marcus/iot-energy-automation'
      }
    ];

    for (const prj of projects) {
      await session.run(`
        MERGE (p:Project {id: $id})
        SET p += $props
      `, { id: prj.id, props: prj });
    }

    // 9. Create Jobs
    console.log('💼 Seeding Jobs...');
    const jobs = [
      {
        id: 'job-001',
        title: 'AI Engineer',
        description: 'Build enterprise AI pipelines, openCypher graph recommenders, and neural model services.',
        location: 'Hyderabad',
        employmentType: 'Full-Time',
        experienceLevel: 'Entry',
        salaryMin: 1200000,
        salaryMax: 1800000,
        remote: true,
        postedAt: '2026-08-10'
      },
      {
        id: 'job-002',
        title: 'Full Stack Developer',
        description: 'Architect modern web apps with Next.js, React, Node.js, and graph data stores.',
        location: 'Hyderabad',
        employmentType: 'Full-Time',
        experienceLevel: 'Entry',
        salaryMin: 1000000,
        salaryMax: 1500000,
        remote: true,
        postedAt: '2026-08-12'
      },
      {
        id: 'job-003',
        title: 'Backend Developer',
        description: 'Develop resilient microservices in Python & Node.js with SQL and Docker.',
        location: 'Bengaluru',
        employmentType: 'Full-Time',
        experienceLevel: 'Mid',
        salaryMin: 1400000,
        salaryMax: 2000000,
        remote: false,
        postedAt: '2026-08-08'
      },
      {
        id: 'job-004',
        title: 'Machine Learning Engineer',
        description: 'Deploy PyTorch deep learning models to AWS Kubernetes production clusters.',
        location: 'Bengaluru',
        employmentType: 'Full-Time',
        experienceLevel: 'Senior',
        salaryMin: 2200000,
        salaryMax: 3200000,
        remote: true,
        postedAt: '2026-08-01'
      },
      {
        id: 'job-005',
        title: 'Frontend Developer',
        description: 'Craft pixel-perfect React & Next.js user interfaces with Tailwind CSS and responsive design.',
        location: 'Hyderabad',
        employmentType: 'Full-Time',
        experienceLevel: 'Entry',
        salaryMin: 900000,
        salaryMax: 1300000,
        remote: true,
        postedAt: '2026-08-14'
      },
      {
        id: 'job-006',
        title: 'Data Engineer & Graph Specialist',
        description: 'Design openCypher graph schemas, CognoDB data pipelines, and SQL warehousing engines.',
        location: 'Hyderabad',
        employmentType: 'Full-Time',
        experienceLevel: 'Mid',
        salaryMin: 1600000,
        salaryMax: 2400000,
        remote: true,
        postedAt: '2026-08-05'
      }
    ];

    for (const j of jobs) {
      await session.run(`
        MERGE (job:Job {id: $id})
        SET job += $props
      `, { id: j.id, props: j });
    }

    // 10. Create Courses
    console.log('🎓 Seeding Courses...');
    const courses = [
      {
        id: 'course-001',
        title: 'PyTorch for Deep Learning',
        platform: 'Coursera',
        url: 'https://coursera.org/learn/pytorch-deep-learning',
        difficulty: 'Intermediate',
        durationHours: 35,
        description: 'Master neural networks, computer vision, and NLP model training using PyTorch.'
      },
      {
        id: 'course-002',
        title: 'Docker Fundamentals & Containerization',
        platform: 'Udemy',
        url: 'https://udemy.com/course/docker-fundamentals',
        difficulty: 'Beginner',
        durationHours: 12,
        description: 'Learn container concepts, Dockerfiles, docker-compose, and multi-stage builds.'
      },
      {
        id: 'course-003',
        title: 'GraphQL Fundamentals',
        platform: 'edX',
        url: 'https://edx.org/course/graphql-fundamentals',
        difficulty: 'Intermediate',
        durationHours: 18,
        description: 'Build flexible schema APIs with GraphQL queries, mutations, and resolvers.'
      },
      {
        id: 'course-004',
        title: 'CognoDB & openCypher Masterclass',
        platform: 'Pluralsight',
        url: 'https://pluralsight.com/courses/cognodb-cypher',
        difficulty: 'Intermediate',
        durationHours: 24,
        description: 'Deep dive into graph modeling, multi-hop traversals, and openCypher optimization.'
      },
      {
        id: 'course-005',
        title: 'Machine Learning Fundamentals',
        platform: 'Coursera',
        url: 'https://coursera.org/learn/machine-learning',
        difficulty: 'Beginner',
        durationHours: 40,
        description: 'Comprehensive introduction to regression, classification, and clustering algorithms.'
      },
      {
        id: 'course-006',
        title: 'AWS Certified Cloud Practitioner',
        platform: 'AWS Training',
        url: 'https://aws.training/cloud-practitioner',
        difficulty: 'Beginner',
        durationHours: 20,
        description: 'Core concepts of AWS cloud infrastructure, security, and deployment.'
      }
    ];

    for (const crs of courses) {
      await session.run(`
        MERGE (c:Course {id: $id})
        SET c += $props
      `, { id: crs.id, props: crs });
    }

    // 11. Create Relationships
    console.log('🔗 Connecting Relationships...');

    // (Job)-[:OFFERED_BY]->(Company)
    await session.run(`
      MATCH (j:Job {id: 'job-001'}), (comp:Company {id: 'company-001'}) MERGE (j)-[:OFFERED_BY]->(comp)
    `);
    await session.run(`
      MATCH (j:Job {id: 'job-002'}), (comp:Company {id: 'company-001'}) MERGE (j)-[:OFFERED_BY]->(comp)
    `);
    await session.run(`
      MATCH (j:Job {id: 'job-003'}), (comp:Company {id: 'company-002'}) MERGE (j)-[:OFFERED_BY]->(comp)
    `);
    await session.run(`
      MATCH (j:Job {id: 'job-004'}), (comp:Company {id: 'company-003'}) MERGE (j)-[:OFFERED_BY]->(comp)
    `);
    await session.run(`
      MATCH (j:Job {id: 'job-005'}), (comp:Company {id: 'company-005'}) MERGE (j)-[:OFFERED_BY]->(comp)
    `);
    await session.run(`
      MATCH (j:Job {id: 'job-006'}), (comp:Company {id: 'company-001'}) MERGE (j)-[:OFFERED_BY]->(comp)
    `);

    // (Candidate)-[:HAS_SKILL]->(Skill) for Alex Johnson (candidate-001)
    const alexSkills = [
      { id: 'skill-python', level: 'Advanced', years: 2 },
      { id: 'skill-javascript', level: 'Advanced', years: 2 },
      { id: 'skill-typescript', level: 'Intermediate', years: 1 },
      { id: 'skill-react', level: 'Advanced', years: 2 },
      { id: 'skill-nextjs', level: 'Intermediate', years: 1 },
      { id: 'skill-nodejs', level: 'Intermediate', years: 1 },
      { id: 'skill-sql', level: 'Intermediate', years: 2 },
      { id: 'skill-ml', level: 'Intermediate', years: 1 },
      { id: 'skill-fastapi', level: 'Intermediate', years: 1 },
      { id: 'skill-pandas', level: 'Intermediate', years: 1 },
      { id: 'skill-git', level: 'Advanced', years: 2 }
    ];

    for (const ask of alexSkills) {
      await session.run(`
        MATCH (c:Candidate {id: 'candidate-001'}), (s:Skill {id: $skillId})
        MERGE (c)-[r:HAS_SKILL]->(s)
        SET r.level = $level, r.years = $years, r.lastUsed = '2026-08'
      `, { skillId: ask.id, level: ask.level, years: ask.years });
    }

    // (Candidate)-[:BUILT]->(Project) for Alex Johnson
    await session.run(`
      MATCH (c:Candidate {id: 'candidate-001'}), (p:Project {id: 'project-001'})
      MERGE (c)-[:BUILT {role: 'Lead ML Engineer', contribution: 'Designed Python NLP pipeline & SQL database.'}]->(p)
    `);
    await session.run(`
      MATCH (c:Candidate {id: 'candidate-001'}), (p:Project {id: 'project-002'})
      MERGE (c)-[:BUILT {role: 'AI Developer', contribution: 'Built object recognition logic & React dashboard.'}]->(p)
    `);
    await session.run(`
      MATCH (c:Candidate {id: 'candidate-001'}), (p:Project {id: 'project-003'})
      MERGE (c)-[:BUILT {role: 'Full Stack Architect', contribution: 'Engineered openCypher traversals & Next.js client.'}]->(p)
    `);

    // (Project)-[:USES_SKILL]->(Skill)
    const projectSkillMap = [
      { proj: 'project-001', skills: ['skill-python', 'skill-ml', 'skill-sql', 'skill-fastapi', 'skill-pandas'] },
      { proj: 'project-002', skills: ['skill-python', 'skill-ml', 'skill-computervision', 'skill-react'] },
      { proj: 'project-003', skills: ['skill-typescript', 'skill-nextjs', 'skill-react', 'skill-nodejs', 'skill-cypher', 'skill-neo4j'] },
      { proj: 'project-004', skills: ['skill-javascript', 'skill-nodejs', 'skill-express', 'skill-sql'] },
      { proj: 'project-005', skills: ['skill-python', 'skill-docker', 'skill-aws', 'skill-postgresql'] }
    ];

    for (const item of projectSkillMap) {
      for (const skId of item.skills) {
        await session.run(`
          MATCH (p:Project {id: $pId}), (s:Skill {id: $sId})
          MERGE (p)-[:USES_SKILL]->(s)
        `, { pId: item.proj, sId: skId });
      }
    }

    // (Job)-[:REQUIRES]->(Skill)
    const jobRequirements = [
      // AI Engineer (job-001 at Wexa AI)
      { jobId: 'job-001', skillId: 'skill-python', importance: 'HIGH', requiredLevel: 'Advanced' },
      { jobId: 'job-001', skillId: 'skill-ml', importance: 'HIGH', requiredLevel: 'Intermediate' },
      { jobId: 'job-001', skillId: 'skill-sql', importance: 'MEDIUM', requiredLevel: 'Intermediate' },
      { jobId: 'job-001', skillId: 'skill-pytorch', importance: 'HIGH', requiredLevel: 'Intermediate' },
      { jobId: 'job-001', skillId: 'skill-docker', importance: 'MEDIUM', requiredLevel: 'Intermediate' },

      // Full Stack Developer (job-002 at Wexa AI)
      { jobId: 'job-002', skillId: 'skill-react', importance: 'HIGH', requiredLevel: 'Advanced' },
      { jobId: 'job-002', skillId: 'skill-nextjs', importance: 'HIGH', requiredLevel: 'Intermediate' },
      { jobId: 'job-002', skillId: 'skill-nodejs', importance: 'HIGH', requiredLevel: 'Intermediate' },
      { jobId: 'job-002', skillId: 'skill-typescript', importance: 'HIGH', requiredLevel: 'Intermediate' },
      { jobId: 'job-002', skillId: 'skill-graphql', importance: 'LOW', requiredLevel: 'Beginner' },

      // Backend Developer (job-003)
      { jobId: 'job-003', skillId: 'skill-nodejs', importance: 'HIGH', requiredLevel: 'Advanced' },
      { jobId: 'job-003', skillId: 'skill-postgresql', importance: 'HIGH', requiredLevel: 'Intermediate' },
      { jobId: 'job-003', skillId: 'skill-docker', importance: 'HIGH', requiredLevel: 'Intermediate' },
      { jobId: 'job-003', skillId: 'skill-aws', importance: 'MEDIUM', requiredLevel: 'Intermediate' },

      // Machine Learning Engineer (job-004)
      { jobId: 'job-004', skillId: 'skill-python', importance: 'HIGH', requiredLevel: 'Advanced' },
      { jobId: 'job-004', skillId: 'skill-pytorch', importance: 'HIGH', requiredLevel: 'Advanced' },
      { jobId: 'job-004', skillId: 'skill-deeplearning', importance: 'HIGH', requiredLevel: 'Advanced' },
      { jobId: 'job-004', skillId: 'skill-kubernetes', importance: 'MEDIUM', requiredLevel: 'Intermediate' }
    ];

    for (const jr of jobRequirements) {
      await session.run(`
        MATCH (j:Job {id: $jobId}), (s:Skill {id: $skillId})
        MERGE (j)-[r:REQUIRES]->(s)
        SET r.importance = $importance, r.requiredLevel = $requiredLevel
      `, { jobId: jr.jobId, skillId: jr.skillId, importance: jr.importance, requiredLevel: jr.requiredLevel });
    }

    // (Course)-[:TEACHES]->(Skill)
    const courseTeaches = [
      { courseId: 'course-001', skillId: 'skill-pytorch' },
      { courseId: 'course-001', skillId: 'skill-deeplearning' },
      { courseId: 'course-002', skillId: 'skill-docker' },
      { courseId: 'course-003', skillId: 'skill-graphql' },
      { courseId: 'course-004', skillId: 'skill-cypher' },
      { courseId: 'course-004', skillId: 'skill-neo4j' },
      { courseId: 'course-005', skillId: 'skill-ml' },
      { courseId: 'course-006', skillId: 'skill-aws' }
    ];

    for (const ct of courseTeaches) {
      await session.run(`
        MATCH (c:Course {id: $cId}), (s:Skill {id: $sId})
        MERGE (c)-[:TEACHES]->(s)
      `, { cId: ct.courseId, sId: ct.skillId });
    }

    // (Skill)-[:PREREQUISITE_OF]->(Skill)
    const prerequisites = [
      { from: 'skill-python', to: 'skill-ml' },
      { from: 'skill-ml', to: 'skill-deeplearning' },
      { from: 'skill-deeplearning', to: 'skill-pytorch' },
      { from: 'skill-javascript', to: 'skill-typescript' },
      { from: 'skill-react', to: 'skill-nextjs' },
      { from: 'skill-sql', to: 'skill-postgresql' },
      { from: 'skill-docker', to: 'skill-kubernetes' }
    ];

    for (const p of prerequisites) {
      await session.run(`
        MATCH (s1:Skill {id: $fromId}), (s2:Skill {id: $toId})
        MERGE (s1)-[:PREREQUISITE_OF]->(s2)
      `, { fromId: p.from, toId: p.to });
    }

    console.log('----------------------------------------------------');
    console.log('🎉 Seed Completed Successfully!');
    console.log('Candidate Alex Johnson (candidate-001) seeded with projects & skills.');
    console.log('Target Job: AI Engineer (job-001) seeded at Wexa AI.');
    console.log('----------------------------------------------------');

  } catch (error: any) {
    console.error('❌ Error during seeding:', error.message || error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

runSeed();
