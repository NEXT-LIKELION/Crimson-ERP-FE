import { api } from "./axios";

export const uploadInventoryExcel = (file: File) => {
    console.log("uploadInventoryExcel - file:", file);
    console.log("file name:", file?.name);
    console.log("file size:", file?.size);
    console.log("file type:", file?.type);

    if (!file) {
        console.error("파일이 없습니다!");
        return Promise.reject(new Error("파일이 없습니다"));
    }

    const formData = new FormData();
    formData.append("file", file);

    // FormData 내용 확인
    for (const [key, value] of formData.entries()) {
        console.log("FormData entry:", key, value);
        if (value instanceof File) {
            console.log("File details:", value.name, value.size, value.type);
        }
    }

    return api.post("/inventory/upload/", formData);
};
