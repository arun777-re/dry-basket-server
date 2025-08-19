import dotenv from "dotenv";
dotenv.config();


export const handleImageUpload = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "drybasket");
    formData.append("folder", "drybasket/images");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await res.json();
    if (res.ok) {
      return result.secure_url;
    } else {
      throw new Error(result.message || "Image upload failed");
    }
  } catch (error: any) {
    console.error("Cloudinary Image upload error", error.message);
    throw new Error("Image upload failed");
  }
};
