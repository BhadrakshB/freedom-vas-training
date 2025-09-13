CREATE TABLE "Message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"isTraining" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"userId" uuid NOT NULL,
	"visibility" varchar DEFAULT 'private' NOT NULL,
	"scenario" json NOT NULL,
	"persona" json NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"score" json,
	"feedback" json,
	"startedAt" timestamp NOT NULL,
	"completedAt" timestamp,
	"version" text DEFAULT '1',
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "UserAuth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"providerUserId" varchar(128) NOT NULL,
	"email" varchar(128),
	"password" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_Thread_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserAuth" ADD CONSTRAINT "UserAuth_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;