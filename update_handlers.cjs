const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Fix handleBatchAddUserAccount
code = code.replace(
  "  const handleBatchAddUserAccount = async (users: Omit<User, 'id'>[]) => { if (isDemoMode) { const newUsers = users.map((u, i) => ({ ...u, id: `user-${Date.now()}-${i}` })); setUsers(prev => [...prev, ...newUsers as User[]]); handleShowNotification('Akun ditambahkan (Mode Demo).', 'success'); return; } await apiService.saveUserBatch(users); handleShowNotification(`Berhasil menambahkan ${users.length} akun!`, 'success'); await fetchData(); };",
  `  const handleBatchAddUserAccount = async (users: Omit<User, 'id'>[]) => {
    const newUsers = users.map((u, i) => ({ ...u, id: \`user-\${Date.now()}-\${i}\` }));
    setUsers(prev => {
      const updated = [...prev, ...newUsers as User[]];
      cacheService.set('users', updated);
      return updated;
    });
    if (isDemoMode) {
      handleShowNotification('Akun ditambahkan (Mode Demo).', 'success');
      return;
    }
    await apiService.saveUserBatch(users);
    handleShowNotification(\`Berhasil menambahkan \${users.length} akun!\`, 'success');
  };`
);

// Fix handleUpdateHoliday
code = code.replace(
  "  const handleUpdateHoliday = async (updatedHoliday: Holiday) => { if (isDemoMode) { setHolidays(prev => prev.map(h => h.id === updatedHoliday.id ? updatedHoliday : h).sort((a,b) => a.date.localeCompare(b.date))); handleShowNotification(\"Hari libur diperbarui (Demo).\", \"success\"); return; } try { await apiService.updateHoliday(updatedHoliday); handleShowNotification(\"Hari libur berhasil diperbarui.\", \"success\"); await fetchData(); } catch(e) { handleShowNotification(\"Gagal memperbarui hari libur.\", \"error\"); } };",
  `  const handleUpdateHoliday = async (updatedHoliday: Holiday) => {
    setHolidays(prev => {
      const updated = prev.map(h => h.id === updatedHoliday.id ? updatedHoliday : h).sort((a,b) => a.date.localeCompare(b.date));
      cacheService.set('holidays', updated);
      return updated;
    });
    if (isDemoMode) {
      handleShowNotification("Hari libur diperbarui (Demo).", "success");
      return;
    }
    try {
      await apiService.updateHoliday(updatedHoliday);
      handleShowNotification("Hari libur berhasil diperbarui.", "success");
    } catch(e) {
      handleShowNotification("Gagal memperbarui hari libur.", "error");
    }
  };`
);

// Fix handleDeleteHoliday
code = code.replace(
  "  const handleDeleteHoliday = async (id: string) => { showConfirm('Hapus hari libur ini?', async () => { if (isDemoMode) { setHolidays(prev => prev.filter(h => h.id !== id)); handleShowNotification(\"Hari libur dihapus (Demo).\", \"success\"); return; } try { await apiService.deleteHoliday(id); handleShowNotification(\"Hari libur berhasil dihapus.\", \"success\"); await fetchData(); } catch (e) { handleShowNotification(\"Gagal menghapus hari libur.\", \"error\"); } }); };",
  `  const handleDeleteHoliday = async (id: string) => {
    showConfirm('Hapus hari libur ini?', async () => {
      setHolidays(prev => {
        const updated = prev.filter(h => h.id !== id);
        cacheService.set('holidays', updated);
        return updated;
      });
      if (isDemoMode) {
        handleShowNotification("Hari libur dihapus (Demo).", "success");
        return;
      }
      try {
        await apiService.deleteHoliday(id);
        handleShowNotification("Hari libur berhasil dihapus.", "success");
      } catch (e) {
        handleShowNotification("Gagal menghapus hari libur.", "error");
      }
    });
  };`
);

fs.writeFileSync('App.tsx', code);
