const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  APPROVED: 'Disahkan',
  CANCELLED: 'Dibatalkan',
  CANCELED: 'Dibatalkan',
  CHANGES_REQUESTED: 'Perlu Perubahan',
  CLOSED: 'Ditutup',
  COMPLETED: 'Selesai',
  CONFIRMED: 'Dikonfirmasi',
  DRAFT: 'Draf',
  HIDDEN: 'Disembunyikan',
  IN_PROGRESS: 'Dalam Penanganan',
  INACTIVE: 'Nonaktif',
  OPEN: 'Terbuka',
  PAID: 'Lunas',
  PENDING: 'Menunggu',
  PENDING_REVIEW: 'Menunggu Peninjauan',
  PLANNED: 'Terjadwal',
  PUBLISHED: 'Tayang',
  RECEIVED: 'Diterima',
  REJECTED: 'Ditolak',
  RESERVED: 'Dipesan',
  RESOLVED: 'Selesai',
  SUBMITTED: 'Dikirim',
  SUSPENDED: 'Ditangguhkan',
  UNPAID: 'Belum Dibayar',
  VERIFIED: 'Terverifikasi',
  VOID: 'Dibatalkan',
};

export function statusLabel(status?: string | null) {
  if (!status) return '-';
  return statusLabels[status] ?? status.replaceAll('_', ' ').toLocaleLowerCase('id-ID');
}
