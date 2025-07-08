import { api } from "./axios";

export const uploadInventoryExcel = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/inventory/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
