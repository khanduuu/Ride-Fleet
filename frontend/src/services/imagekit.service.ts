import { upload } from "@imagekit/javascript";
import { apiClient } from "./api-client";

interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

async function getAuth(): Promise<ImageKitAuthResponse> {
  return apiClient.request<ImageKitAuthResponse>("/imagekit/auth");
}

export async function uploadVehicleImage(file: File) {
  const auth = await getAuth();

  const result = await upload({
    file,
    fileName: file.name,

    token: auth.token,
    expire: auth.expire,
    signature: auth.signature,
    publicKey: auth.publicKey,

    folder: "/ridefleet/vehicles",

    useUniqueFileName: true,
  });

  return result;
}