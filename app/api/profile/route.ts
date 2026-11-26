import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User, { type IUser } from "@/models/User";
import type {
  ApiResponse,
  ProfileUpdate,
  StudentProfile,
} from "@/types";

const webUrlSchema = z.union([
  z.literal(""),
  z.url({ protocol: /^https?$/ }),
]);

const ProfileUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    bio: z.string().trim().max(500),
    campus: z.string().trim().max(120),
    branch: z.string().trim().max(120),
    year: z.number().int().min(1).max(8).nullable(),
    skills: z.array(z.string().trim().min(1).max(40)).max(30),
    interests: z.array(z.string().trim().min(1).max(40)).max(30),
    socialLinks: z
      .object({
        github: webUrlSchema,
        linkedin: webUrlSchema,
        portfolio: webUrlSchema,
        instagram: webUrlSchema,
      })
      .strict(),
    projects: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            title: z.string().trim().min(1).max(120),
            description: z.string().trim().max(1000),
            technologies: z
              .array(z.string().trim().min(1).max(40))
              .max(20),
            githubUrl: webUrlSchema,
            liveUrl: webUrlSchema,
          })
          .strict()
      )
      .max(20),
    achievements: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            title: z.string().trim().min(1).max(120),
            category: z.string().trim().min(1).max(50),
            description: z.string().trim().max(500),
            date: z.string().trim().max(30),
          })
          .strict()
      )
      .max(30),
  })
  .strict();

function toStudentProfile(user: IUser): StudentProfile {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    campus: user.campus ?? "",
    branch: user.branch ?? "",
    year: user.year ?? null,
    bio: user.bio ?? "",
    skills: user.skills ?? [],
    interests: user.interests ?? [],
    socialLinks: {
      github: user.socialLinks?.github ?? "",
      linkedin: user.socialLinks?.linkedin ?? "",
      portfolio: user.socialLinks?.portfolio ?? "",
      instagram: user.socialLinks?.instagram ?? "",
    },
    projects: user.projects ?? [],
    achievements: user.achievements ?? [],
    createdAt: user.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const tokenPayload = await getAuthUser();

    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(tokenPayload.userId);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<StudentProfile>>(
      {
        success: true,
        message: "Profile fetched successfully.",
        data: toStudentProfile(user),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const tokenPayload = await getAuthUser();

    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const result = ProfileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: result.error.issues[0]?.message ?? "Invalid profile data.",
        },
        { status: 400 }
      );
    }

    const profile: ProfileUpdate = result.data;
    await connectDB();
    const user = await User.findById(tokenPayload.userId);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    user.name = profile.name;
    user.bio = profile.bio;
    user.campus = profile.campus;
    user.branch = profile.branch;
    user.year = profile.year ?? undefined;
    user.skills = profile.skills;
    user.interests = profile.interests;
    user.socialLinks = profile.socialLinks;
    user.projects = profile.projects;
    user.achievements = profile.achievements;
    await user.save();

    return NextResponse.json<ApiResponse<StudentProfile>>(
      {
        success: true,
        message: "Profile updated successfully.",
        data: toStudentProfile(user),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PUT /api/profile]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
