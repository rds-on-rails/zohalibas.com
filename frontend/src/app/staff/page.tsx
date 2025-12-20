'use client'

import React from 'react'
import Link from 'next/link'
import { useStaff } from '@/contexts/StaffContext'
import { validateStaff, sanitizeInput, formatValidationErrors } from '@/lib/validation'

export default function StaffPage() {
  const { 
    staffMembers, 
    loading, 
    error, 
    hasPermission, 
    createStaff, 
    updateStaff, 
    deleteStaff 
  } = useStaff()

  const [showAddForm, setShowAddForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    email: '',
    displayName: '',
    role: 'worker' as 'owner' | 'manager' | 'worker',
  })
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // Check permissions
  if (!hasPermission('manage_staff')) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to manage staff.</p>
          <Link href="/" className="btn-primary inline-block">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const resetForm = () => {
    setFormData({ email: '', displayName: '', role: 'worker' })
    setFormError(null)
    setShowAddForm(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateStaff({
      email: sanitizeInput(formData.email),
      displayName: sanitizeInput(formData.displayName),
      role: formData.role,
    })
    
    if (!validation.isValid) {
      setFormError(formatValidationErrors(validation.errors))
      return
    }
    
    setSubmitting(true)
    setFormError(null)
    
    try {
      if (editingId) {
        await updateStaff(editingId, {
          displayName: sanitizeInput(formData.displayName),
          role: formData.role,
        })
      } else {
        await createStaff({
          email: sanitizeInput(formData.email),
          displayName: sanitizeInput(formData.displayName),
          role: formData.role,
        })
      }
      resetForm()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save staff member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (staff: any) => {
    setFormData({
      email: staff.email,
      displayName: staff.displayName,
      role: staff.role,
    })
    setEditingId(staff.id)
    setShowAddForm(true)
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateStaff(id, { active: !currentActive })
    } catch (err: any) {
      alert(err.message || 'Failed to update staff member')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return
    }
    
    try {
      await deleteStaff(id)
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                <p className="text-gray-600 mt-1">Manage team members and permissions</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Staff Member
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingId}
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Role</label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="worker">Worker</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {formError}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'} Staff Member
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading staff members...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : staffMembers.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No staff members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffMembers.map((staff) => (
                    <tr key={staff.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{staff.displayName}</div>
                          <div className="text-sm text-gray-500">{staff.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                          staff.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                          staff.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          staff.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {staff.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(staff)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(staff.id, staff.active)}
                          className={staff.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        >
                          {staff.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(staff.id, staff.displayName)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role Permissions Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Worker</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• View dashboard</li>
                <li>• Create sales</li>
                <li>• Create expenses</li>
                <li>• View sales</li>
                <li>• View expenses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Manager</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All Worker permissions</li>
                <li>• Edit sales</li>
                <li>• Edit expenses</li>
                <li>• View reports</li>
                <li>• Export data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Owner</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All Manager permissions</li>
                <li>• Delete sales</li>
                <li>• Delete expenses</li>
                <li>• Manage staff</li>
                <li>• Full system access</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}