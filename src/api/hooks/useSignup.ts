import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { post } from "../client";
import type { TxSignupRequest, TxSignupResponse } from "../types";

export function useSignup(
  options?: UseMutationOptions<TxSignupResponse, Error, TxSignupRequest>,
) {
  return useMutation({
    mutationFn: (signupData: TxSignupRequest) =>
      post<TxSignupResponse>("/tx/signup", signupData),
    ...options,
  });
}
