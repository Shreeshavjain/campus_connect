import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User, { type IUser } from "@/models/User";
import type { ApiResponse, PublicStudentProfile } from "@/types";

function toPublicStudentProfile(user: IUser): PublicStudentProfile {
  return {
    id: user._id.toString(),
    name: user.name,
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Student profile not found." },
        { status: 404 }
      );
    }

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Student profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<PublicStudentProfile>>(
      {
        success: true,
        message: "Student profile fetched successfully.",
        data: toPublicStudentProfile(user),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/students/[id]]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
