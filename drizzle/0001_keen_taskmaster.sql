CREATE TABLE "ThreadGroup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupName" text NOT NULL,
	"groupFeedback" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Thread" ADD COLUMN "groupId" uuid;--> statement-breakpoint
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_groupId_ThreadGroup_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."ThreadGroup"("id") ON DELETE no action ON UPDATE no action;