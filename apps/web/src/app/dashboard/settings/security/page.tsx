"use client";

import React from "react";

import Link from "next/link";
import toast from "react-hot-toast";
import { workspaceApi, projectApi, githubApi, notificationApi, billingApi, authApi } from "../../../../lib/api";

import {
  User as UserIcon, Settings as SettingsIcon, Users as UsersIcon, Sliders, LayoutDashboard,
  Columns3, Check, AlertCircle, Sparkles, Save, Clock, Github, GitBranch, GitPullRequest,
  RefreshCw, Link2, Unlink, ExternalLink, Key, ShieldCheck, FolderGit2, Bell, CreditCard,
  HardDrive, Zap, ArrowRight, Shield, Trash2, Copy, Link as LinkIcon, UserPlus, Info, Lock,
  AlertTriangle, X, Smartphone, Monitor, KeyRound, Volume2, Moon, Sun, Laptop, Globe,
  Calendar, BadgeCheck, QrCode, Download, FileText
} from "lucide-react";

import { useSettingsContext } from "../SettingsContext";
import { TIMEZONES, AVATAR_GRADIENTS, DATE_FORMAT_OPTIONS, RBAC_ROLE_PERMISSIONS_MATRIX, ROLES } from "../constants";

export default function SecurityTab() {
  const {
    changingPassword,
    disablePassword,
    handleChangePassword,
    handleDisable2Fa,
    handleRevokeSession,
    handleStart2FaSetup,
    is2FaEnabled,
    passwordForm,
    sessions,
    setDisablePassword,
    setPasswordForm,
    setShowDisable2Fa,
    showDisable2Fa,
    is2FaModalOpen,
    setIs2FaModalOpen,
    twoFaSetupData,
    twoFaCodeInput,
    setTwoFaCodeInput,
    handleVerify2Fa,
    verifying2Fa,
    twoFaCopied,
    setTwoFaCopied,
    recoveryCodes,
    setRecoveryCodes,
  } = useSettingsContext();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Account Security &amp; Authentication
        </h3>
        <p className="text-xs text-slate-500">
          Update your password, manage two-factor authentication (2FA), and inspect active sessions
        </p>
      </div>

      {/* Change Password Card */}
      <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-600" /> Change Password
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
              placeholder="••••••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                placeholder="Re-type new password"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={changingPassword}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {changingPassword ? "Updating Password..." : "Update Password"}
          </button>
        </div>
      </form>

      {/* Two-Factor Authentication (2FA) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" /> Two-Factor Authentication (2FA)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Protect your DevFlow account with an authenticator app (Google Authenticator, Authy, 1Password).
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              is2FaEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}>
              {is2FaEnabled ? "2FA Enabled" : "2FA Disabled"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            {is2FaEnabled
              ? "Two-factor authentication is active. You will be prompted for an OTP on every sign-in."
              : "We strongly recommend enabling 2FA to safeguard code repositories and API keys."}
          </p>

          {is2FaEnabled ? (
            <button
              type="button"
              onClick={() => setShowDisable2Fa(true)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors cursor-pointer shrink-0"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart2FaSetup}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Enable 2FA</span>
            </button>
          )}
        </div>

        {/* Recovery codes display if recently enabled */}
        {is2FaEnabled && recoveryCodes && recoveryCodes.length > 0 && (
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" /> Active Backup Recovery Codes
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  toast.success("Recovery codes copied to clipboard!");
                }}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copy Codes
              </button>
            </div>
            <p className="text-[11px] text-indigo-800">
              Save these one-time codes in a secure place. Each code can only be used once if you lose access to your authenticator app.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="bg-white border border-indigo-200/80 rounded-md px-2 py-1 font-mono text-[11px] text-indigo-900 font-semibold text-center select-all">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disable 2FA confirmation inline */}
        {showDisable2Fa && (
          <form onSubmit={handleDisable2Fa} className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-fade-in">
            <p className="text-xs font-bold text-rose-900">Enter your password to disable 2FA:</p>
            <div className="flex gap-2">
              <input
                type="password"
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter account password"
                className="flex-1 bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Confirm Disable
              </button>
              <button
                type="button"
                onClick={() => setShowDisable2Fa(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active Login Sessions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-600" /> Active Login Sessions
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Devices and terminals currently authenticated with your token family
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {sessions.map((sess) => (
            <div key={sess.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-2xs ${
                  sess.isCurrent ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {sess.device.includes("Mobile") || sess.device.includes("iPhone") ? (
                    <Smartphone className="w-4 h-4" />
                  ) : sess.device.includes("CLI") ? (
                    <Laptop className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{sess.device} &bull; {sess.browser}</span>
                    {sess.isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {sess.os} &bull; {sess.ip} &bull; {sess.location} &bull; <span className="font-medium text-slate-700">{sess.lastActive}</span>
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(sess.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer self-end sm:self-center"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── 2FA Setup & Verification Modal ─── */}
      {is2FaModalOpen && twoFaSetupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Set Up Two-Factor Authentication
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scan the QR code with your authenticator app to enable 2FA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIs2FaModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Step 1: Scan QR Code */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Scan with Authenticator App
                  </h4>
                </div>
                <p className="text-xs text-slate-500 pl-8">
                  Open Google Authenticator, Authy, 1Password, or Microsoft Authenticator and scan this QR code:
                </p>

                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                    <img
                      src={twoFaSetupData.qrCodeUrl}
                      alt="2FA QR Code"
                      className="w-44 h-44 object-contain"
                    />
                  </div>

                  <div className="w-full flex flex-col items-center gap-1">
                    <span className="text-[11px] text-slate-400 font-medium">Or enter secret key manually:</span>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 max-w-full">
                      <code className="text-xs font-mono font-bold text-indigo-700 tracking-wider select-all break-all">
                        {twoFaSetupData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFaSetupData.secret);
                          setTwoFaCopied(true);
                          toast.success("Secret key copied!");
                          setTimeout(() => setTwoFaCopied(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer shrink-0"
                        title="Copy secret key"
                      >
                        {twoFaCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Emergency Backup Codes */}
              {twoFaSetupData.recoveryCodes && twoFaSetupData.recoveryCodes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Emergency Backup Codes
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const content = twoFaSetupData.recoveryCodes.join("\n");
                        navigator.clipboard.writeText(content);
                        toast.success("All recovery codes copied!");
                      }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy All
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 pl-8">
                    Save these single-use recovery codes in a secure password manager in case you lose access to your authenticator device:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pl-8">
                    {twoFaSetupData.recoveryCodes.map((code, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-800 text-center font-semibold select-all">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Verify 6-digit Code */}
              <form onSubmit={handleVerify2Fa} className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Enter 6-Digit Code
                  </h4>
                </div>
                <p className="text-xs text-slate-500 pl-8">
                  Enter the 6-digit verification code generated by your authenticator app to complete activation:
                </p>
                <div className="pl-8 space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={twoFaCodeInput}
                    onChange={(e) => setTwoFaCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl p-3 text-slate-900 outline-none transition-all"
                  />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIs2FaModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={verifying2Fa || twoFaCodeInput.length !== 6}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {verifying2Fa ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Activate 2FA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
