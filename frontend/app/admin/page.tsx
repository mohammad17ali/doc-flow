'use client'

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, FileText, Plus, Trash2, Edit, X, 
  Check, AlertCircle, ArrowLeft, Search, ArrowUpDown,
  ArrowUp, ArrowDown, UserPlus, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAllUsers,
  getAllUserGroups,
  getAllDocumentsAdmin,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  bulkDeleteUserGroups,
  addUserToGroup,
  removeUserFromGroup,
  addDocumentPermission,
  removeDocumentPermission,
  createDocument,
  scanDocuments,
  bulkDeleteDocuments
} from '@/lib/api';
import { User, UserGroup, DocumentPermission } from '@/types/auth';

type TabType = 'users' | 'groups' | 'documents';
type SortDirection = 'asc' | 'desc' | null;

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [documents, setDocuments] = useState<DocumentPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, groupsData, documentsData] = await Promise.all([
        getAllUsers(false),
        getAllUserGroups(false),
        getAllDocumentsAdmin(),
      ]);
      setUsers(usersData);
      setGroups(groupsData);
      setDocuments(documentsData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Manage users, groups, and permissions</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 max-w-md"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</span>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 max-w-md"
          >
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'users'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
            {activeTab === 'users' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'groups'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Groups
            {activeTab === 'groups' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'documents'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Documents
            {activeTab === 'documents' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="p-6 max-w-[1800px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground animate-pulse">Loading...</div>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <UsersTab
                users={users}
                groups={groups}
                onRefresh={fetchData}
                onShowSuccess={showSuccess}
                onShowError={showError}
              />
            )}
            {activeTab === 'groups' && (
              <GroupsTab
                groups={groups}
                users={users}
                onRefresh={fetchData}
                onShowSuccess={showSuccess}
                onShowError={showError}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab
                documents={documents}
                groups={groups}
                onRefresh={fetchData}
                onShowSuccess={showSuccess}
                onShowError={showError}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Users Tab Component
function UsersTab({
  users,
  groups,
  onRefresh,
  onShowSuccess,
  onShowError,
}: {
  users: User[];
  groups: UserGroup[];
  onRefresh: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'username' | 'email' | 'fullName' | 'groups'>('username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    groupIds: [] as string[],
  });

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
        user.groups?.some(g => g.toLowerCase().includes(searchLower))
      );
    });

    if (sortDirection) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        
        if (sortField === 'groups') {
          aVal = a.groups?.join(', ') || '';
          bVal = b.groups?.join(', ') || '';
        } else {
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    return filtered;
  }, [users, searchQuery, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.userId)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Delete ${selectedUsers.size} user(s)?`)) return;

    try {
      const result = await bulkDeleteUsers(Array.from(selectedUsers));
      onShowSuccess(`Deleted ${result.deletedCount} user(s)`);
      setSelectedUsers(new Set());
      onRefresh();
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Failed to delete users');
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      groupIds: [],
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      password: '',
      groupIds: user.groupIds,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        const updates: any = {
          email: formData.email,
          fullName: formData.fullName,
        };
        if (formData.password) {
          updates.password = formData.password;
        }
        await updateUser(editingUser.userId, updates);

        const currentGroups = new Set(editingUser.groupIds);
        const newGroups = new Set(formData.groupIds);

        for (const groupId of newGroups) {
          if (!currentGroups.has(groupId)) {
            await addUserToGroup(editingUser.userId, groupId);
          }
        }

        for (const groupId of currentGroups) {
          if (!newGroups.has(groupId)) {
            await removeUserFromGroup(editingUser.userId, groupId);
          }
        }

        onShowSuccess('User updated successfully');
      } else {
        const userId = await createUser({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
        });

        for (const groupId of formData.groupIds) {
          await addUserToGroup(userId, groupId);
        }

        onShowSuccess('User created successfully');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      onShowSuccess('User deleted successfully');
      onRefresh();
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const SortButton = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field && sortDirection === 'asc' && <ArrowUp className="w-3 h-3" />}
      {sortField === field && sortDirection === 'desc' && <ArrowDown className="w-3 h-3" />}
      {sortField !== field && <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedUsers.length} user{filteredAndSortedUsers.length !== 1 ? 's' : ''}
            {selectedUsers.size > 0 && ` • ${selectedUsers.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete ({selectedUsers.size})
            </Button>
          )}
          <Button onClick={handleCreateUser} className="gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortButton field="username">Username</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="fullName">Full Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="email">Email</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="groups">Groups</SortButton>
              </TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <TableRow key={user.userId} data-state={selectedUsers.has(user.userId) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.userId)}
                      onCheckedChange={() => handleSelectUser(user.userId)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.fullName || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.groups && user.groups.length > 0 ? (
                        user.groups.map((groupName) => {
                          const isAdmin = groupName.toLowerCase() === 'admin';
                          return (
                            <span
                              key={groupName}
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                isAdmin
                                  ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                  : 'bg-primary/10 text-primary border border-primary/30'
                              }`}
                            >
                              {groupName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.userId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Modal */}
      {showModal && (
        <Modal
          title={editingUser ? 'Edit User' : 'Create User'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingUser}
                placeholder="username"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Password {editingUser && '(leave empty to keep current)'}
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Groups</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
                {groups.map((group) => (
                  <label key={group._id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.groupIds.includes(group._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, groupIds: [...formData.groupIds, group._id] });
                        } else {
                          setFormData({ ...formData, groupIds: formData.groupIds.filter(id => id !== group._id) });
                        }
                      }}
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Groups Tab Component
function GroupsTab({
  groups,
  users,
  onRefresh,
  onShowSuccess,
  onShowError,
}: {
  groups: UserGroup[];
  users: User[];
  onRefresh: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'description' | 'members'>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const groupMemberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    groups.forEach(group => {
      const memberCount = users.filter(u => u.groupIds.includes(group._id)).length;
      counts.set(group._id, memberCount);
    });
    return counts;
  }, [groups, users]);

  const filteredAndSortedGroups = useMemo(() => {
    let filtered = groups.filter(group => {
      const searchLower = searchQuery.toLowerCase();
      return (
        group.name.toLowerCase().includes(searchLower) ||
        (group.description && group.description.toLowerCase().includes(searchLower))
      );
    });

    if (sortDirection) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        
        if (sortField === 'members') {
          aVal = groupMemberCounts.get(a._id) || 0;
          bVal = groupMemberCounts.get(b._id) || 0;
        } else {
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    return filtered;
  }, [groups, searchQuery, sortField, sortDirection, groupMemberCounts]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedGroups.size === filteredAndSortedGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredAndSortedGroups.map(g => g._id)));
    }
  };

  const handleSelectGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedGroups.size === 0) return;
    if (!confirm(`Delete ${selectedGroups.size} group(s)?`)) return;

    try {
      const result = await bulkDeleteUserGroups(Array.from(selectedGroups));
      onShowSuccess(`Deleted ${result.deletedCount} group(s)`);
      setSelectedGroups(new Set());
      onRefresh();
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Failed to delete groups');
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingGroup) {
        await updateUserGroup(editingGroup._id, formData);
        onShowSuccess('Group updated successfully');
      } else {
        await createUserGroup(formData);
        onShowSuccess('Group created successfully');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await deleteUserGroup(groupId);
      onShowSuccess('Group deleted successfully');
      onRefresh();
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const SortButton = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field && sortDirection === 'asc' && <ArrowUp className="w-3 h-3" />}
      {sortField === field && sortDirection === 'desc' && <ArrowDown className="w-3 h-3" />}
      {sortField !== field && <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Groups</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedGroups.length} group{filteredAndSortedGroups.length !== 1 ? 's' : ''}
            {selectedGroups.size > 0 && ` • ${selectedGroups.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedGroups.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete ({selectedGroups.size})
            </Button>
          )}
          <Button onClick={handleCreateGroup} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Group
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedGroups.size === filteredAndSortedGroups.length && filteredAndSortedGroups.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortButton field="name">Group Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="description">Description</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="members">Members</SortButton>
              </TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No groups found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedGroups.map((group) => {
                const memberCount = groupMemberCounts.get(group._id) || 0;
                return (
                  <TableRow key={group._id} data-state={selectedGroups.has(group._id) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGroups.has(group._id)}
                        onCheckedChange={() => handleSelectGroup(group._id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="max-w-md truncate">{group.description || '-'}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {memberCount} user{memberCount !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Group Modal */}
      {showModal && (
        <Modal
          title={editingGroup ? 'Edit Group' : 'Create Group'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Group Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Engineering Team"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Group description"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({
  documents,
  groups,
  onRefresh,
  onShowSuccess,
  onShowError,
}: {
  documents: DocumentPermission[];
  groups: UserGroup[];
  onRefresh: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}) {
  const [showScanModal, setShowScanModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentPermission | null>(null);
  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'documentId' | 'permissions'>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const searchLower = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(searchLower) ||
        doc.documentId.toLowerCase().includes(searchLower)
      );
    });

    if (sortDirection) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        
        if (sortField === 'permissions') {
          aVal = a.permissions.length;
          bVal = b.permissions.length;
        } else {
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    return filtered;
  }, [documents, searchQuery, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredAndSortedDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredAndSortedDocuments.map(d => d.documentId)));
    }
  };

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    if (!confirm(`Delete ${selectedDocuments.size} document(s)?`)) return;

    try {
      const result = await bulkDeleteDocuments(Array.from(selectedDocuments));
      onShowSuccess(`Deleted ${result.deletedCount} document(s)`);
      setSelectedDocuments(new Set());
      onRefresh();
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Failed to delete documents');
    }
  };

  const handleScanDocuments = async () => {
    try {
      setScanning(true);
      const result = await scanDocuments();
      setAvailableDocs(result.newFolders);
      setShowScanModal(true);
    } catch (err: any) {
      onShowError('Failed to scan documents');
    } finally {
      setScanning(false);
    }
  };

  const handleAddDocument = async (docId: string) => {
    try {
      await createDocument({ documentId: docId, name: docId });
      onShowSuccess(`Document ${docId} added successfully`);
      onRefresh();
      setAvailableDocs(availableDocs.filter(d => d !== docId));
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Failed to add document');
    }
  };

  const handleManagePermissions = (doc: DocumentPermission) => {
    setSelectedDocument(doc);
    setShowPermissionModal(true);
  };

  const handleTogglePermission = async (groupId: string, hasPermission: boolean) => {
    if (!selectedDocument) return;

    try {
      if (hasPermission) {
        await removeDocumentPermission(selectedDocument.documentId, groupId);
        onShowSuccess('Permission removed');
      } else {
        await addDocumentPermission(selectedDocument.documentId, groupId);
        onShowSuccess('Permission added');
      }
      onRefresh();
      
      // Update selected document
      const updated = await getAllDocumentsAdmin();
      const updatedDoc = updated.find(d => d.documentId === selectedDocument.documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (err: any) {
      onShowError(err.response?.data?.message || 'Failed to update permission');
    }
  };

  const SortButton = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field && sortDirection === 'asc' && <ArrowUp className="w-3 h-3" />}
      {sortField === field && sortDirection === 'desc' && <ArrowDown className="w-3 h-3" />}
      {sortField !== field && <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedDocuments.length} document{filteredAndSortedDocuments.length !== 1 ? 's' : ''}
            {selectedDocuments.size > 0 && ` • ${selectedDocuments.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocuments.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete ({selectedDocuments.size})
            </Button>
          )}
          <Button onClick={handleScanDocuments} disabled={scanning} className="gap-2">
            <Plus className="w-4 h-4" />
            {scanning ? 'Scanning...' : 'Scan for Documents'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedDocuments.size === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortButton field="name">Document Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="documentId">Document ID</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="permissions">Permissions</SortButton>
              </TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedDocuments.map((doc) => (
                <TableRow key={doc.documentId} data-state={selectedDocuments.has(doc.documentId) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDocuments.has(doc.documentId)}
                      onCheckedChange={() => handleSelectDocument(doc.documentId)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell className="font-mono text-sm">{doc.documentId}</TableCell>
                  <TableCell>
                    {doc.permissions.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.permissions.length}</span>
                        </div>
                        <div className="flex -space-x-1">
                          {doc.permissions.slice(0, 3).map((perm) => {
                            const group = groups.find(g => g._id === perm.groupId);
                            const isAdmin = group?.name.toLowerCase() === 'admin';
                            return (
                              <div
                                key={perm.groupId}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-background ${
                                  isAdmin
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-primary text-primary-foreground'
                                }`}
                                title={group?.name || perm.groupId}
                              >
                                {(group?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                          {doc.permissions.length > 3 && (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-background bg-muted text-muted-foreground"
                              title={`${doc.permissions.length - 3} more group${doc.permissions.length - 3 !== 1 ? 's' : ''}`}
                            >
                              +{doc.permissions.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManagePermissions(doc)}
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Scan Modal */}
      {showScanModal && (
        <Modal
          title="Available Documents"
          onClose={() => setShowScanModal(false)}
          onSubmit={() => setShowScanModal(false)}
          submitText="Close"
        >
          <div className="space-y-3">
            {availableDocs.length > 0 ? (
              availableDocs.map((docId) => (
                <div
                  key={docId}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <span className="font-mono text-sm">{docId}</span>
                  <Button size="sm" onClick={() => handleAddDocument(docId)}>
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-6">No new documents found</p>
            )}
          </div>
        </Modal>
      )}

      {/* Permission Modal */}
      {showPermissionModal && selectedDocument && (
        <Modal
          title={`Manage Permissions: ${selectedDocument.name}`}
          onClose={() => setShowPermissionModal(false)}
          onSubmit={() => setShowPermissionModal(false)}
          submitText="Done"
        >
          <div className="space-y-2">
            {groups.map((group) => {
              const hasPermission = selectedDocument.permissions.some(p => p.groupId === group._id);
              return (
                <label
                  key={group._id}
                  className="flex items-center gap-3 p-3 rounded hover:bg-secondary/50 cursor-pointer border border-border"
                >
                  <Checkbox
                    checked={hasPermission}
                    onCheckedChange={() => handleTogglePermission(group._id, hasPermission)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Modal Component
function Modal({
  title,
  children,
  onClose,
  onSubmit,
  submitText = 'Save',
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitText?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{submitText}</Button>
        </div>
      </motion.div>
    </div>
  );
}
