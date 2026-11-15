import { describe, expect, it } from "vitest";

import {
  createDemoPost,
  deleteDemoPost,
  getDemoPostById,
  listAllDemoPosts,
  listDemoPostsByGrade,
  listTeacherPosts,
} from "../../src/server/posts/demo-post-store";

describe("demo-post-store", () => {
  it("creates posts and supports school-wide and grade-specific posts", () => {
    const schoolPost = createDemoPost({
      authorId: "director-1",
      authorName: "Direction",
      authorRole: "DIRECTOR",
      subject: "Administration",
      grade: 0,
      title: "Rentrée scolaire",
      description: "Bienvenue à tous.",
      type: "ANNOUNCEMENT",
      audience: "ALL",
    });

    const grade2Post = createDemoPost({
      authorId: "teacher-1",
      authorName: "M. Ali",
      authorRole: "TEACHER",
      subject: "Maths",
      grade: 2,
      title: "Devoir de maths",
      description: "Exercices page 10",
      type: "EXERCISE",
      audience: "STUDENTS",
    });

    expect(schoolPost.id).toBeDefined();
    expect(grade2Post.id).toBeDefined();

    // Grade 2 should see both grade 2 posts and school-wide posts
    const grade2Posts = listDemoPostsByGrade(2, "STUDENTS");
    expect(grade2Posts.some((p) => p.id === grade2Post.id)).toBe(true);
    expect(grade2Posts.some((p) => p.id === schoolPost.id)).toBe(true);

    // Grade 3 should see school-wide posts but NOT grade 2 post
    const grade3Posts = listDemoPostsByGrade(3, "STUDENTS");
    expect(grade3Posts.some((p) => p.id === schoolPost.id)).toBe(true);
    expect(grade3Posts.some((p) => p.id === grade2Post.id)).toBe(false);
  });

  it("filters out posts targeted for another audience", () => {
    const parentOnlyPost = createDemoPost({
      authorId: "director-1",
      authorName: "Direction",
      authorRole: "DIRECTOR",
      subject: "Réunion",
      grade: 1,
      title: "Réunion des parents",
      description: "Vendredi à 16h",
      type: "ANNOUNCEMENT",
      audience: "PARENTS",
    });

    // Student in grade 1 should not see parent-only post
    const studentFeed = listDemoPostsByGrade(1, "STUDENTS");
    expect(studentFeed.some((p) => p.id === parentOnlyPost.id)).toBe(false);

    // Parent in grade 1 should see parent-only post
    const parentFeed = listDemoPostsByGrade(1, "PARENTS");
    expect(parentFeed.some((p) => p.id === parentOnlyPost.id)).toBe(true);

    // Teacher-only post created by Director
    const teacherOnlyPost = createDemoPost({
      authorId: "director-fethi",
      authorName: "Fethi Omri (Direction)",
      authorRole: "DIRECTOR",
      subject: "Conseil des maîtres",
      grade: 0,
      title: "Réunion urgente des enseignants",
      description: "Salle 1 à 15h",
      type: "ANNOUNCEMENT",
      audience: "TEACHERS",
    });

    // Neither students nor parents should see teacher-only post
    expect(listDemoPostsByGrade(1, "STUDENTS").some((p) => p.id === teacherOnlyPost.id)).toBe(false);
    expect(listDemoPostsByGrade(1, "PARENTS").some((p) => p.id === teacherOnlyPost.id)).toBe(false);
  });

  it("supports soft deletion / moderation by director with reason tracking", () => {
    const post = createDemoPost({
      authorId: "teacher-2",
      authorName: "Mme Leila",
      authorRole: "TEACHER",
      subject: "Français",
      grade: 4,
      title: "Exercice supprimé",
      description: "Test moderation",
      type: "EXERCISE",
      audience: "ALL",
    });

    expect(getDemoPostById(post.id)?.deletedAt).toBeUndefined();

    // Moderate / delete
    const success = deleteDemoPost(post.id, "Information obsolète");
    expect(success).toBe(true);

    const updated = getDemoPostById(post.id);
    expect(updated?.deletedAt).toBeInstanceOf(Date);
    expect(updated?.deletedReason).toBe("Information obsolète");

    // Student feed shouldn't see deleted post
    const grade4Posts = listDemoPostsByGrade(4);
    expect(grade4Posts.some((p) => p.id === post.id)).toBe(false);

    // listAllDemoPosts(false) shouldn't contain it, but listAllDemoPosts(true) should
    expect(listAllDemoPosts(false).some((p) => p.id === post.id)).toBe(false);
    expect(listAllDemoPosts(true).some((p) => p.id === post.id)).toBe(true);
  });

  it("retrieves teacher-targeted posts and director broadcasts for teacher space", () => {
    const teacherMeeting = createDemoPost({
      authorId: "director-fethi",
      authorName: "Fethi Omri",
      authorRole: "DIRECTOR",
      subject: "Conseil pédagogique",
      grade: 0,
      title: "Convocation conseil de classe",
      description: "Présence requise jeudi.",
      type: "ANNOUNCEMENT",
      audience: "TEACHERS",
    });

    const teacherPosts = listTeacherPosts();
    expect(teacherPosts.some((p) => p.id === teacherMeeting.id)).toBe(true);

    // Delete the meeting and verify it is no longer listed in active teacher posts
    deleteDemoPost(teacherMeeting.id, "Réunion reportée");
    const updatedTeacherPosts = listTeacherPosts();
    expect(updatedTeacherPosts.some((p) => p.id === teacherMeeting.id)).toBe(false);
  });
});
