"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  Users, 
  Check, 
  X, 
  RefreshCw,
  Crown,
  Clock,
  UserX,
  UserCheck,
  UserMinus
} from 'lucide-react'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { User } from '@/types/user'

export default function UserManagementPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <UserManagementContent />
    </ProtectedRoute>
  )
}

function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(usersQuery)
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as User[]
      setUsers(usersData)
    } catch (error) {
      console.error('ユーザー一覧の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, role: User['role']) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        approvedAt: role === 'user' || role === 'admin' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      })
      
      // ローカル状態を更新
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role, updatedAt: new Date().toISOString() }
          : user
      ))
      
      alert(`ユーザーのロールを「${getRoleLabel(role)}」に更新しました`)
    } catch (error) {
      console.error('ユーザーロールの更新に失敗しました:', error)
      alert('ユーザーロールの更新に失敗しました')
    }
  }

  const updateUserStatus = async (userId: string, status: User['status']) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        updatedAt: new Date().toISOString()
      })
      
      // ローカル状態を更新
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status, updatedAt: new Date().toISOString() }
          : user
      ))
      
      alert(`ユーザーのステータスを「${getStatusLabel(status)}」に更新しました`)
    } catch (error) {
      console.error('ユーザーステータスの更新に失敗しました:', error)
      alert('ユーザーステータスの更新に失敗しました')
    }
  }

  const getRoleLabel = (role: User['role']) => {
    switch (role) {
      case 'pending': return '承認待ち'
      case 'user': return '一般ユーザー'
      case 'admin': return '管理者'
      case 'rejected': return '承認拒否'
      default: return role
    }
  }

  const getStatusLabel = (status: User['status']) => {
    switch (status) {
      case 'active': return 'アクティブ'
      case 'inactive': return '非アクティブ'
      case 'suspended': return '停止中'
      default: return status
    }
  }

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />アクティブ</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><UserMinus className="h-3 w-3 mr-1" />非アクティブ</Badge>
      case 'suspended':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><UserX className="h-3 w-3 mr-1" />停止中</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />承認待ち</Badge>
      case 'user':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />ユーザー</Badge>
      case 'admin':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Crown className="h-3 w-3 mr-1" />管理者</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><UserX className="h-3 w-3 mr-1" />拒否</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const pendingUsers = users.filter(user => user.role === 'pending')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            ユーザー管理
          </h1>
          <p className="text-gray-600 mt-2">
            システムユーザーの承認と管理
          </p>
        </div>
        <div className="ml-auto">
          <Button 
            onClick={loadUsers} 
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            更新
          </Button>
        </div>
      </div>

      {/* 承認待ちユーザーの通知 */}
      {pendingUsers.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              承認待ちユーザー ({pendingUsers.length}名)
            </CardTitle>
            <CardDescription className="text-yellow-700">
              以下のユーザーが承認を待っています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0) : user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateUserRole(user.id, 'user')}
                      className="flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateUserRole(user.id, 'rejected')}
                      className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                      拒否
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 全ユーザー一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>全ユーザー一覧</CardTitle>
          <CardDescription>
            システムに登録されている全ユーザーの一覧
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ユーザーが見つかりません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead>最終ログイン</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>
                            {user.displayName ? user.displayName.charAt(0) : user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP')
                        : '未ログイン'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {user.role === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateUserRole(user.id, 'user')}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              承認
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(user.id, 'rejected')}
                              className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-3 w-3" />
                              拒否
                            </Button>
                          </>
                        )}
                        {user.role === 'user' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(user.id, 'admin')}
                              className="flex items-center gap-1"
                            >
                              <Crown className="h-3 w-3" />
                              管理者に
                            </Button>
                            {user.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserStatus(user.id, 'inactive')}
                                className="flex items-center gap-1 text-gray-600 border-gray-200 hover:bg-gray-50"
                              >
                                <UserMinus className="h-3 w-3" />
                                非アクティブに
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => updateUserStatus(user.id, 'active')}
                                className="flex items-center gap-1"
                              >
                                <UserCheck className="h-3 w-3" />
                                アクティブに
                              </Button>
                            )}
                          </>
                        )}
                        {user.role === 'admin' && user.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserStatus(user.id, 'inactive')}
                            className="flex items-center gap-1 text-gray-600 border-gray-200 hover:bg-gray-50"
                          >
                            <UserMinus className="h-3 w-3" />
                            非アクティブに
                          </Button>
                        )}
                        {user.role === 'admin' && user.status === 'inactive' && (
                          <Button
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="flex items-center gap-1"
                          >
                            <UserCheck className="h-3 w-3" />
                            アクティブに
                          </Button>
                        )}
                        {user.role === 'rejected' && (
                          <Button
                            size="sm"
                            onClick={() => updateUserRole(user.id, 'user')}
                            className="flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            承認
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}