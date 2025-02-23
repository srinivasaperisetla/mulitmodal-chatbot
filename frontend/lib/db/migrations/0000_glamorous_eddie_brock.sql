CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"password" varchar(64) NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
