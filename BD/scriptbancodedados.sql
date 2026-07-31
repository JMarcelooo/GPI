CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" serial NOT NULL UNIQUE,
	"nome" varchar(50) NOT NULL,
	"email" varchar(50) NOT NULL,
	PRIMARY KEY ("id")
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
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pagamentos" (
	"id" serial NOT NULL UNIQUE,
	"pi_id" bigint NOT NULL,
	"tipo_de_pagamento" varchar(50) NOT NULL,
	"data_de_vencimento" date NOT NULL,
	"valor" double precision NOT NULL,
	"status" varchar(50) NOT NULL DEFAULT 'aguardando prazo',
	"processo_sei" varchar(100),
	"observacao" varchar(255) NOT NULL,
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
	"email" varchar(50) NOT NULL,
	"bond" varchar(30) NOT NULL,
	"department" varchar(50) NOT NULL,
	"campus" varchar(30) NOT NULL,
  "university" varchar(50) NOT NULL,
  "gender" varchar(20) NOT NULL DEFAULT 'Nao informado',
  "phone" varchar(20) NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "autor_pi" (
	"pi_id" bigint NOT NULL,
	"autor_id" bigint NOT NULL
);



ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_fk1" FOREIGN KEY ("pi_id") REFERENCES "pi"("id");

-- Migração para tabelas existentes (adiciona novos campos de pagamento)
ALTER TABLE "pagamentos" ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'aguardando prazo';
ALTER TABLE "pagamentos" ADD COLUMN IF NOT EXISTS "processo_sei" varchar(100);
ALTER TABLE "controle_processos" ADD CONSTRAINT "controle_processos_fk1" FOREIGN KEY ("pi_id") REFERENCES "pi"("id");
ALTER TABLE "RPI" ADD CONSTRAINT "RPI_fk2" FOREIGN KEY ("pi_id") REFERENCES "pi"("id");


ALTER TABLE "autor_pi" ADD CONSTRAINT "autor_pi_fk0" FOREIGN KEY ("pi_id") REFERENCES "pi"("id");

ALTER TABLE "autor_pi" ADD CONSTRAINT "autor_pi_fk1" FOREIGN KEY ("autor_id") REFERENCES "autor"("id");
