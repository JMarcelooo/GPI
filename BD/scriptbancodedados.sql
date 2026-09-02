CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" serial NOT NULL UNIQUE,
	"nome" varchar(150) NOT NULL,
	"username" varchar(30) UNIQUE,
	"email" varchar(255) NOT NULL,
	"senha" varchar(255),
	"role" varchar(50) NOT NULL DEFAULT 'usuario',
	"ativo" boolean NOT NULL DEFAULT true,
	"deveTrocarSenha" boolean NOT NULL DEFAULT false,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	PRIMARY KEY ("id"),
	CONSTRAINT "uq_usuarios_email" UNIQUE ("email"),
	CONSTRAINT "uq_usuarios_username" UNIQUE ("username"),
	CONSTRAINT "chk_usuarios_role" CHECK ("role" IN ('admin', 'usuario')),
	CONSTRAINT "chk_usuarios_username" CHECK ("username" ~ '^[a-z0-9_.]{3,30}$')
);

CREATE TABLE IF NOT EXISTS "pi" (
	"id" serial NOT NULL UNIQUE,
	"tipo" varchar(50) NOT NULL,
	"titulo" varchar(200),
	"depositante" varchar(100) NOT NULL,
	"parceiro" varchar(100),
	"titular" jsonb NOT NULL DEFAULT '[]',
	"status" varchar(50) NOT NULL,
	"protocolo" varchar(50) NOT NULL UNIQUE,
	"data_entrada" date,
	"ano" integer,
	"termo_cessao" boolean NOT NULL DEFAULT false,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	PRIMARY KEY ("id"),
	CONSTRAINT "chk_pi_tipo" CHECK ("tipo" IN ('patente de invencao', 'modelo de utilidade', 'marca', 'programa de computador')),
	CONSTRAINT "chk_pi_status" CHECK ("status" IN ('indeferida', 'anulada', 'arquivada', 'em analise', 'deferida', 'registrada', 'carta patente'))
);

CREATE TABLE IF NOT EXISTS "pagamentos" (
	"id" serial NOT NULL UNIQUE,
	"pi_id" bigint NOT NULL,
	"tipo_de_pagamento" varchar(50) NOT NULL,
	"data_de_vencimento" date NOT NULL,
	"data_informada" date,
	"valor" double precision NOT NULL,
	"status" varchar(50) NOT NULL DEFAULT 'aguardando prazo',
	"prazo_dias" integer,
	"processo_sei" text,
	"observacao" text,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "controle_processos" (
	"id" serial NOT NULL UNIQUE,
	"pi_id" bigint NOT NULL,
	"numero_processo" varchar(50) NOT NULL UNIQUE,
	"data_criacao" date NOT NULL,
	"assunto" varchar(50) NOT NULL UNIQUE,
	"situacao" varchar(50) NOT NULL,
	"obs" varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS "RPI" (
	"id" serial NOT NULL UNIQUE,
	"data" date NOT NULL,
	"pi_id" integer NOT NULL,
	"codigo_evento" double precision NOT NULL,
	"descricao_do_evento" varchar(255),
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "indicadores_anuais" (
	"id" serial NOT NULL UNIQUE,
	"ano" date NOT NULL,
	"tipo_pi" varchar(50) NOT NULL,
	"quantidade_total" bigint NOT NULL,
	"origem" varchar(50) NOT NULL,
	"tipo_de_indicador" varchar(50) NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "autor" (
	"id" serial NOT NULL UNIQUE,
	"name" varchar(50) NOT NULL,
	"email" varchar(50),
	"bond" varchar(30),
	"department" varchar(50),
	"campus" varchar(30),
  "university" varchar(50),
  "gender" varchar(20) DEFAULT 'Nao informado',
  "phone" varchar(20),
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "autor_pi" (
	"pi_id" bigint NOT NULL,
	"autor_id" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "notificacoes" (
	"id" serial NOT NULL UNIQUE,
	"pagamento_id" integer,
	"pi_id" integer,
	"rpi_numero" integer,
	"tipo" varchar(50) NOT NULL DEFAULT 'prazo',
	"mensagem" varchar(255) NOT NULL,
	"data_vencimento" date,
	"lida" boolean NOT NULL DEFAULT false,
	"lida_por_id" integer,
	"lida_por_nome" varchar(150),
	"lida_em" timestamp with time zone,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	PRIMARY KEY ("id"),
	CONSTRAINT "uq_notificacao_pagamento" UNIQUE ("pagamento_id")
);

-- Edições da RPI (INPI) já processadas pelo monitor de publicações
CREATE TABLE IF NOT EXISTS "rpi_edicoes" (
	"numero" integer NOT NULL,
	"data_publicacao" date,
	"processada_em" timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY ("numero")
);

CREATE TABLE IF NOT EXISTS "historico" (
	"id" serial NOT NULL UNIQUE,
	"pi_id" integer,
	"usuario_id" integer,
	"usuario_nome" varchar(150),
	"tipo" varchar(30) NOT NULL,
	"acao" varchar(30) NOT NULL,
	"descricao" varchar(500) NOT NULL,
	"detalhes" jsonb,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	PRIMARY KEY ("id")
);



ALTER TABLE "pagamentos" DROP CONSTRAINT IF EXISTS "pagamentos_fk1";
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_fk1" FOREIGN KEY ("pi_id") REFERENCES "pi"("id") ON DELETE CASCADE;

-- Migração para tabelas existentes (adiciona novos campos de pagamento)
ALTER TABLE "pagamentos" ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'aguardando prazo';
ALTER TABLE "pagamentos" ADD COLUMN IF NOT EXISTS "processo_sei" text;
ALTER TABLE "pagamentos" ADD COLUMN IF NOT EXISTS "prazo_dias" integer;
ALTER TABLE "pagamentos" ADD COLUMN IF NOT EXISTS "data_informada" date;
-- Migração: aumenta limite de processo_sei/observacao (antes varchar 100/255)
ALTER TABLE "pagamentos" ALTER COLUMN "processo_sei" TYPE text USING "processo_sei"::text;
ALTER TABLE "pagamentos" ALTER COLUMN "observacao" TYPE text USING "observacao"::text;
ALTER TABLE "controle_processos" DROP CONSTRAINT IF EXISTS "controle_processos_fk1";
ALTER TABLE "controle_processos" ADD CONSTRAINT "controle_processos_fk1" FOREIGN KEY ("pi_id") REFERENCES "pi"("id") ON DELETE CASCADE;
ALTER TABLE "RPI" DROP CONSTRAINT IF EXISTS "RPI_fk2";
ALTER TABLE "RPI" ADD CONSTRAINT "RPI_fk2" FOREIGN KEY ("pi_id") REFERENCES "pi"("id") ON DELETE CASCADE;

ALTER TABLE "historico" DROP CONSTRAINT IF EXISTS "historico_fk1";
ALTER TABLE "historico" ADD CONSTRAINT "historico_fk1" FOREIGN KEY ("pi_id") REFERENCES "pi"("id") ON DELETE CASCADE;

ALTER TABLE "autor_pi" DROP CONSTRAINT IF EXISTS "autor_pi_fk0";
ALTER TABLE "autor_pi" ADD CONSTRAINT "autor_pi_fk0" FOREIGN KEY ("pi_id") REFERENCES "pi"("id") ON DELETE CASCADE;

ALTER TABLE "autor_pi" DROP CONSTRAINT IF EXISTS "autor_pi_fk1";
ALTER TABLE "autor_pi" ADD CONSTRAINT "autor_pi_fk1" FOREIGN KEY ("autor_id") REFERENCES "autor"("id") ON DELETE CASCADE;

-- Índices de performance (Fase 1)
CREATE INDEX IF NOT EXISTS "idx_pagamentos_pi_id" ON "pagamentos" ("pi_id");
CREATE INDEX IF NOT EXISTS "idx_pagamentos_data_de_vencimento" ON "pagamentos" ("data_de_vencimento");
CREATE INDEX IF NOT EXISTS "idx_pagamentos_status" ON "pagamentos" ("status");
CREATE INDEX IF NOT EXISTS "idx_autor_pi_pi_id_autor_id" ON "autor_pi" ("pi_id", "autor_id");

-- Migração: alinha notificações ao modelo atual (globais, sem usuario_id, com lida_por_*)
ALTER TABLE "notificacoes" DROP CONSTRAINT IF EXISTS "uq_notificacao_pagamento_usuario";
ALTER TABLE "notificacoes" ALTER COLUMN "pagamento_id" DROP NOT NULL;
ALTER TABLE "notificacoes" DROP COLUMN IF EXISTS "usuario_id";
ALTER TABLE "notificacoes" ADD COLUMN IF NOT EXISTS "lida_por_id" integer;
ALTER TABLE "notificacoes" ADD COLUMN IF NOT EXISTS "lida_por_nome" varchar(150);
ALTER TABLE "notificacoes" ADD COLUMN IF NOT EXISTS "lida_em" timestamp with time zone;
ALTER TABLE "notificacoes" ADD COLUMN IF NOT EXISTS "rpi_numero" integer;

DROP INDEX IF EXISTS "uq_notificacao_rpi";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notificacao_rpi"
	ON "notificacoes" ("tipo", "pi_id", "rpi_numero")
	WHERE "tipo" = 'rpi';

-- Tabela de tokens para convite e reset de senha (fluxo por e-mail)
CREATE TABLE IF NOT EXISTS "password_tokens" (
	"id" serial NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"token_hash" varchar(255),
	"codigo_hash" varchar(255),
	"expira_em" timestamp with time zone NOT NULL,
	"usado_em" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "chk_password_tokens_tipo" CHECK ("tipo" IN ('convite', 'reset_codigo'))
);
CREATE INDEX IF NOT EXISTS "idx_password_tokens_user_id" ON "password_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_password_tokens_token_hash" ON "password_tokens" ("token_hash");
ALTER TABLE "password_tokens" DROP CONSTRAINT IF EXISTS "password_tokens_fk_user";
ALTER TABLE "password_tokens" ADD CONSTRAINT "password_tokens_fk_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;

-- Migração: username e senha nullable para fluxo de convite
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "username" varchar(30) UNIQUE;
ALTER TABLE "usuarios" ALTER COLUMN "senha" DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_usuarios_username') THEN
    ALTER TABLE "usuarios" ADD CONSTRAINT "uq_usuarios_username" UNIQUE ("username");
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_usuarios_username') THEN
    ALTER TABLE "usuarios" ADD CONSTRAINT "chk_usuarios_username" CHECK ("username" ~ '^[a-z0-9_.]{3,30}$');
  END IF;
END $$;
