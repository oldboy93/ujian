const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

async function repair() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    console.log("--- STARTING DB REPAIR ---");
    
    const answers = await prisma.participantAnswer.findMany({
       include: { question: true }
    });
    
    console.log(`Processing ${answers.length} answers...`);
    
    for (const ans of answers) {
       let correctScore = 0;
       
       if (ans.isCorrect) {
          const base = Number(ans.question.pointCorrect) || 0;
          const bonus = Number(ans.question.bonusPerSecond) || 0;
          const timeRem = Number(ans.timeRemainingSeconds) || 0;
          correctScore = base + (bonus * timeRem);
       } else {
          correctScore = Number(ans.question.pointWrong) || 0;
       }
       
       if (isNaN(correctScore)) correctScore = 0;
       
       await prisma.participantAnswer.update({
          where: { id: ans.id },
          data: { scoreEarned: correctScore }
       });
    }
    
    console.log("Answer scores repaired. Re-aggregating total scores...");
    
    const participants = await prisma.participant.findMany({
       include: { answers: true }
    });
    
    for (const p of participants) {
       // Calculate from DB fresh to ensure accuracy
       const answersNow = await prisma.participantAnswer.findMany({
          where: { participantId: p.id }
       });
       const sum = answersNow.reduce((acc, curr) => acc + (Number(curr.scoreEarned) || 0), 0);
       
       await prisma.participant.update({
          where: { id: p.id },
          data: { totalScore: sum }
       });
       console.log(`Fixed Participant ${p.name}: New Total Score = ${sum}`);
    }
    
    console.log("--- REPAIR COMPLETE ---");
    
  } catch (err) {
    console.error("REPAIR FAILED:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

repair();
