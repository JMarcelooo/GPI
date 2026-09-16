require('dotenv').config();

const sequelize = require('../src/config/db');

// Quando roda standalone, precisa carregar os models
if (require.main === module) {
  const initModels = require('../src/models/init-models');
  initModels(sequelize);
}

async function initDatabase() {
  await sequelize.authenticate();
  console.log('Conectado ao banco de dados.');

  await sequelize.sync({ alter: true });
  console.log('✅ Tabelas sincronizadas (sequelize.sync alter:true).');

  // Migrações que o sync não cobre (tipos complexos, backfills)
  await sequelize.query(`
    ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "username" varchar(30) UNIQUE;
    ALTER TABLE "usuarios" ALTER COLUMN "senha" DROP NOT NULL;
  `).catch(()=>{});
  await sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_usuarios_username') THEN
        ALTER TABLE "usuarios" ADD CONSTRAINT "uq_usuarios_username" UNIQUE ("username");
      END IF;
    END $$;
  `).catch(()=>{});
  await sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pi' AND column_name='parceiro' AND data_type='character varying') THEN
        ALTER TABLE "pi" ALTER COLUMN "parceiro" TYPE jsonb USING CASE
          WHEN "parceiro" IS NULL OR "parceiro" = '' THEN '[]'::jsonb
          ELSE to_jsonb(ARRAY["parceiro"])
        END;
        ALTER TABLE "pi" ALTER COLUMN "parceiro" SET DEFAULT '[]'::jsonb;
        ALTER TABLE "pi" ALTER COLUMN "parceiro" SET NOT NULL;
      END IF;
    END $$;
  `).catch(()=>{});

  // Backfill username para usuários antigos
  try {
    const { User } = require('../src/models');
    const semUsername = await User.findAll({ where: { username: null } });
    for (const u of semUsername) {
      const base = String(u.nome || 'user').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0,20) || 'user';
      let cand = base;
      let n = 0;
      while (await User.findOne({ where: { username: cand } })) {
        n += 1;
        cand = `${base}${n}`.slice(0,30);
        if (n>100) break;
      }
      u.username = cand;
      await u.save();
      console.log(`🔧 Username backfill: ${u.email} → ${cand}`);
    }
  } catch {}

  const tabelas = Object.keys(sequelize.models).sort();
  console.log(`Tabelas (${tabelas.length}):`, tabelas.join(', '));
}

// Execução direta: node scripts/init-db.js
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => { console.error('Erro:', err); process.exit(1); });
}

module.exports = initDatabase;
