'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { FeeCategory, PaymentMethod } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  Coins,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Receipt,
  Building2,
} from 'lucide-react';

export default function MasterBiayaPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'kepala_sekolah';

  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State: 'fees' | 'paymentMethods'
  const [activeTab, setActiveTab] = useState<'fees' | 'paymentMethods'>('fees');

  // Modal Fee Category State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isFeeSubmitting, setIsFeeSubmitting] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeCategory | null>(null);
  const [feeForm, setFeeForm] = useState({
    name: '',
    type: 'monthly' as 'monthly' | 'incidental',
    defaultAmount: 0,
    description: '',
    isActive: true,
  });
  const [feeErrors, setFeeErrors] = useState<Record<string, string>>({});

  // Modal Payment Method State
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isMethodSubmitting, setIsMethodSubmitting] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [methodForm, setMethodForm] = useState({
    name: '',
    type: 'cash' as 'cash' | 'transfer',
    accountNumber: '',
    accountHolder: '',
    isActive: true,
  });
  const [methodErrors, setMethodErrors] = useState<Record<string, string>>({});

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{
    type: 'fee' | 'method';
    id: number;
    name: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [feeRes, methodRes] = await Promise.all([
        apiClient.get<FeeCategory[]>('/fee-categories'),
        apiClient.get<PaymentMethod[]>('/payment-methods'),
      ]);

      if (feeRes.success && feeRes.data) {
        setFeeCategories(feeRes.data);
      }
      if (methodRes.success && methodRes.data) {
        setPaymentMethods(methodRes.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Fee Handlers
  const handleOpenCreateFee = () => {
    setEditingFee(null);
    setFeeForm({
      name: '',
      type: 'monthly',
      defaultAmount: 350000,
      description: '',
      isActive: true,
    });
    setFeeErrors({});
    setIsFeeModalOpen(true);
  };

  const handleOpenEditFee = (item: FeeCategory) => {
    setEditingFee(item);
    setFeeForm({
      name: item.name,
      type: item.type,
      defaultAmount: item.defaultAmount,
      description: item.description || '',
      isActive: item.isActive,
    });
    setFeeErrors({});
    setIsFeeModalOpen(true);
  };

  const handleSubmitFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!feeForm.name.trim()) errs.name = 'Nama pos biaya wajib diisi';
    if (feeForm.defaultAmount < 0) errs.defaultAmount = 'Nominal tidak boleh kurang dari 0';

    if (Object.keys(errs).length > 0) {
      setFeeErrors(errs);
      return;
    }

    setIsFeeSubmitting(true);
    try {
      if (editingFee) {
        await apiClient.put(`/fee-categories/${editingFee.id}`, feeForm);
      } else {
        await apiClient.post('/fee-categories', feeForm);
      }
      setIsFeeModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setFeeErrors({ general: errRes.message || 'Gagal menyimpan kategori biaya' });
    } finally {
      setIsFeeSubmitting(false);
    }
  };

  // Method Handlers
  const handleOpenCreateMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      name: '',
      type: 'transfer',
      accountNumber: '',
      accountHolder: '',
      isActive: true,
    });
    setMethodErrors({});
    setIsMethodModalOpen(true);
  };

  const handleOpenEditMethod = (item: PaymentMethod) => {
    setEditingMethod(item);
    setMethodForm({
      name: item.name,
      type: item.type,
      accountNumber: item.accountNumber || '',
      accountHolder: item.accountHolder || '',
      isActive: item.isActive,
    });
    setMethodErrors({});
    setIsMethodModalOpen(true);
  };

  const handleSubmitMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!methodForm.name.trim()) errs.name = 'Nama metode pembayaran wajib diisi';
    if (methodForm.type === 'transfer' && !methodForm.accountNumber.trim()) {
      errs.accountNumber = 'Nomor rekening transfer bank wajib diisi';
    }

    if (Object.keys(errs).length > 0) {
      setMethodErrors(errs);
      return;
    }

    setIsMethodSubmitting(true);
    try {
      if (editingMethod) {
        await apiClient.put(`/payment-methods/${editingMethod.id}`, methodForm);
      } else {
        await apiClient.post('/payment-methods', methodForm);
      }
      setIsMethodModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setMethodErrors({ general: errRes.message || 'Gagal menyimpan metode pembayaran' });
    } finally {
      setIsMethodSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const endpoint =
        deletingItem.type === 'fee'
          ? `/fee-categories/${deletingItem.id}`
          : `/payment-methods/${deletingItem.id}`;
      await apiClient.delete(endpoint);
      setIsDeleteModalOpen(false);
      fetchData();
    } catch {
      // Handled
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Tarif & Rekening Pembayaran
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Konfigurasi pos iuran siswa (SPP/Gedung) dan saluran penerimaan kasir (Tunai/Bank).
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {activeTab === 'fees' ? (
              <Button variant="primary" size="sm" onClick={handleOpenCreateFee}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Tambah Pos Biaya</span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleOpenCreateMethod}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Tambah Rekening / Saluran</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'fees'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Kategori Biaya & Iuran ({feeCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('paymentMethods')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'paymentMethods'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Metode & Rekening Bank ({paymentMethods.length})</span>
        </button>
      </div>

      {/* TAB 1: KATEGORI BIAYA */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-medium">
                  <th className="py-3 px-4">Nama Pos Biaya</th>
                  <th className="py-3 px-4">Tipe Biaya</th>
                  <th className="py-3 px-4 text-right">Tarif Standar</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {feeCategories.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4 font-semibold text-zinc-950">{f.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={f.type === 'monthly' ? 'info' : 'warning'} size="sm">
                        {f.type === 'monthly' ? 'Bulanan (SPP)' : 'Insidental'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-zinc-950">
                      {formatRupiah(f.defaultAmount)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">{f.description || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={f.isActive ? 'success' : 'neutral'} size="sm">
                        {f.isActive ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isReadOnly ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditFee(f)}
                            className="px-2 py-1 h-7"
                          >
                            <Pencil className="w-3 h-3 text-zinc-600" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setDeletingItem({ type: 'fee', id: f.id, name: f.name });
                              setIsDeleteModalOpen(true);
                            }}
                            className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: METODE PEMBAYARAN */}
      {activeTab === 'paymentMethods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                    {m.type === 'cash' ? (
                      <Receipt className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <Badge variant={m.isActive ? 'success' : 'neutral'} size="sm">
                    {m.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold text-zinc-950">{m.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Saluran: {m.type === 'cash' ? 'Uang Tunai Fisik' : 'Transfer Perbankan'}
                </p>

                {m.type === 'transfer' && (
                  <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
                    <div className="text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
                      Nomor Rekening
                    </div>
                    <div className="font-mono font-medium text-zinc-900 mt-0.5">
                      {m.accountNumber || '-'}
                    </div>
                    <div className="text-zinc-500 mt-1">a.n. {m.accountHolder || '-'}</div>
                  </div>
                )}
              </div>

              {!isReadOnly && (
                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditMethod(m)}
                    className="px-2 py-1 h-7"
                  >
                    <Pencil className="w-3 h-3 text-zinc-600 mr-1" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setDeletingItem({ type: 'method', id: m.id, name: m.name });
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Biaya */}
      <Modal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        title={editingFee ? 'Edit Pos Tarif Biaya' : 'Tambah Pos Tarif Biaya'}
        size="md"
      >
        <form onSubmit={handleSubmitFee} className="space-y-4">
          <InputField
            label="Nama Pos Biaya"
            placeholder="Contoh: SPP Bulanan atau Uang Gedung"
            value={feeForm.name}
            onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
            errorMessage={feeErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Tipe Pembayaran"
              options={[
                { label: 'Bulanan (SPP Terjadwal)', value: 'monthly' },
                { label: 'Insidental (Sekali Bayar/Cicilan)', value: 'incidental' },
              ]}
              value={feeForm.type}
              onChange={(e) =>
                setFeeForm({ ...feeForm, type: e.target.value as 'monthly' | 'incidental' })
              }
            />

            <InputField
              label="Tarif Standar (Rp)"
              type="number"
              placeholder="350000"
              value={feeForm.defaultAmount.toString()}
              onChange={(e) =>
                setFeeForm({ ...feeForm, defaultAmount: parseInt(e.target.value || '0', 10) })
              }
              errorMessage={feeErrors.defaultAmount}
              required
            />
          </div>

          <InputField
            label="Keterangan / Rincian Alokasi"
            placeholder="Iuran operasional laboratorium..."
            value={feeForm.description}
            onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
          />

          <div className="flex items-center gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
            <input
              type="checkbox"
              id="feeActiveCheck"
              checked={feeForm.isActive}
              onChange={(e) => setFeeForm({ ...feeForm, isActive: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="feeActiveCheck" className="text-xs text-zinc-800 cursor-pointer select-none">
              Pos Biaya Aktif Digunakan di Kasir
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsFeeModalOpen(false)}
              disabled={isFeeSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isFeeSubmitting}
            >
              Simpan Biaya
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Add/Edit Metode Pembayaran */}
      <Modal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        title={editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
        size="md"
      >
        <form onSubmit={handleSubmitMethod} className="space-y-4">
          <InputField
            label="Nama Saluran / Rekening"
            placeholder="Contoh: Transfer Bank Mandiri"
            value={methodForm.name}
            onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
            errorMessage={methodErrors.name}
            required
          />

          <SelectField
            label="Tipe Saluran"
            options={[
              { label: 'Transfer Bank', value: 'transfer' },
              { label: 'Uang Tunai (Kasir)', value: 'cash' },
            ]}
            value={methodForm.type}
            onChange={(e) =>
              setMethodForm({ ...methodForm, type: e.target.value as 'cash' | 'transfer' })
            }
          />

          {methodForm.type === 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Nomor Rekening"
                placeholder="Contoh: 123-00-123456-7"
                value={methodForm.accountNumber}
                onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                errorMessage={methodErrors.accountNumber}
                required
              />
              <InputField
                label="Atas Nama (Pemilik)"
                placeholder="Contoh: SMK Pintar Bangsa"
                value={methodForm.accountHolder}
                onChange={(e) => setMethodForm({ ...methodForm, accountHolder: e.target.value })}
                errorMessage={methodErrors.accountHolder}
              />
            </div>
          )}

          <div className="flex items-center gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
            <input
              type="checkbox"
              id="methodActiveCheck"
              checked={methodForm.isActive}
              onChange={(e) => setMethodForm({ ...methodForm, isActive: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="methodActiveCheck" className="text-xs text-zinc-800 cursor-pointer select-none">
              Saluran Aktif untuk Transaksi Kasir
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsMethodModalOpen(false)}
              disabled={isMethodSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isMethodSubmitting}
            >
              Simpan Saluran
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Data"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              Apakah Anda yakin ingin menghapus <strong>{deletingItem?.name}</strong>?
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
