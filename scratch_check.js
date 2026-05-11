const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const exams = await prisma.exam.findMany({
      include: {
        questions: true,
        participants: { include: { answers: true } }
      }
    });
    console.log("--- FULL DIAGNOSTICS ---");
    exams.forEach(e => {
       console.log(`EXAM: ${e.title} | PIN: ${e.pin} | Limit: ${e.maxViolations}`);
       e.questions.forEach(q => console.log(`  - Q: ${q.type} | Corr: "${q.correctAnswer}" | Pt: ${q.pointCorrect}`));
       e.participants.forEach(p => {
          console.log(`  - P: ${p.name} | Status: ${p.status} | Score: ${p.totalScore}`);
          p.answers.forEach(a => console.log(`      Ans: "${a.answerText}" | Corr: ${a.isCorrect} | ScoreEarned: ${a.scoreEarned}`));
       });
    });
  } catch (err) {
    console.error("DB ERROR:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
