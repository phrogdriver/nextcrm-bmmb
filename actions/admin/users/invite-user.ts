"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { generateRandomPassword } from "@/lib/utils";
import { hash } from "bcryptjs";
import InviteUserEmail from "@/emails/InviteUser";
import resendHelper from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { Language } from "@prisma/client";

export const inviteUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  language: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const { firstName, lastName, email, language } = data;

  if (!firstName || !lastName || !email || !language) {
    return { error: "First Name, Last Name, Email, and Language are required!" };
  }

  const name = `${firstName} ${lastName}`;

  let resend: any = null;
  try {
    resend = await resendHelper();
  } catch {
    // Resend not configured — user will still be created, just no email sent
  }

  let message = "";
  switch (language) {
    case "en":
      message = `You have been invited to ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${email} \n\n Your password is: [generated] \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
      break;
    case "es":
      message = `Ha sido invitado a ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Su nombre de usuario es: ${email} \n\n Por favor inicie sesión en ${process.env.NEXT_PUBLIC_APP_URL} \n\n Gracias \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
      break;
    default:
      message = `You have been invited to ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${email} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
      break;
  }

  const checkexisting = await prismadb.users.findFirst({
    where: { email },
  });

  if (checkexisting) {
    return { error: "User already exist, reset password instead!" };
  }

  try {
    const password = generateRandomPassword();

    const user = await prismadb.users.create({
      data: {
        name,
        first_name: firstName,
        last_name: lastName,
        username: "",
        avatar: "",
        account_name: "",
        is_account_admin: false,
        is_admin: false,
        email,
        userStatus: "ACTIVE",
        userLanguage: language as Language,
        password: await hash(password, 12),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        account_name: true,
        avatar: true,
        is_admin: true,
        is_account_admin: true,
        userLanguage: true,
        userStatus: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return { error: "User not created" };
    }

    if (resend) {
      try {
        await resend.emails.send({
          from:
            process.env.NEXT_PUBLIC_APP_NAME +
            " <" +
            process.env.EMAIL_FROM +
            ">",
          to: user.email,
          subject: `You have been invited to ${process.env.NEXT_PUBLIC_APP_NAME}`,
          text: message,
          react: InviteUserEmail({
            invitedByUsername: session.user?.name! || "admin",
            username: user?.name!,
            invitedUserPassword: password,
            userLanguage: language,
          }),
        });
      } catch {
        // Email failed but user was created
      }
    }

    revalidatePath("/[locale]/(routes)/admin", "page");
    return { data: user };
  } catch (error) {
    console.log("[INVITE_USER]", error);
    return { error: "Failed to invite user" };
  }
};
