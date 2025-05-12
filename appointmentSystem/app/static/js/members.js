export function initializeMembers() {
    class MemberManager {
        constructor() {
            this.members = [];
            this.currentPage = 1;
            this.itemsPerPage = 10;
            this.initializeEventListeners();
            this.loadMembers();
        }
    
        initializeEventListeners() {
            // 新增會員按鈕
            document.getElementById('addMemberBtn').addEventListener('click', () => this.showModal());
    
            // 搜尋功能
            document.getElementById('memberSearch').addEventListener('input', (e) => {
                this.filterMembers(e.target.value);
            });
    
            // Modal 相關
            document.querySelector('.close').addEventListener('click', () => this.hideModal());
            document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());
            
            // 表單提交
            document.getElementById('memberForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    
        async loadMembers() {
            try {
                // 模擬 API 呼叫
                const response = await fetch('/api/members');
                this.members = await response.json();
                this.renderMembers();
            } catch (error) {
                console.error('載入會員資料失敗:', error);
                this.showError('載入會員資料失敗');
            }
        }
    
        renderMembers() {
            const tbody = document.getElementById('membersTableBody');
            tbody.innerHTML = '';
    
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedMembers = this.members.slice(startIndex, endIndex);
    
            paginatedMembers.forEach(member => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${member.id}</td>
                    <td>${this.escapeHtml(member.name)}</td>
                    <td>${this.escapeHtml(member.phone)}</td>
                    <td>${this.escapeHtml(member.email)}</td>
                    <td>${new Date(member.joinDate).toLocaleDateString()}</td>
                    <td>
                        <span class="status-badge ${member.status}">
                            ${member.status === 'active' ? '啟用' : '停用'}
                        </span>
                    </td>
                    <td>
                        <button onclick="memberManager.editMember(${member.id})" class="btn-edit">編輯</button>
                        <button onclick="memberManager.deleteMember(${member.id})" class="btn-delete">刪除</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
    
            this.renderPagination();
        }
    
        renderPagination() {
            const totalPages = Math.ceil(this.members.length / this.itemsPerPage);
            const pagination = document.getElementById('membersPagination');
            pagination.innerHTML = '';
    
            for (let i = 1; i <= totalPages; i++) {
                const button = document.createElement('button');
                button.textContent = i;
                button.classList.add('page-btn');
                if (i === this.currentPage) button.classList.add('active');
                button.addEventListener('click', () => {
                    this.currentPage = i;
                    this.renderMembers();
                });
                pagination.appendChild(button);
            }
        }
    
        async handleFormSubmit() {
            const memberData = {
                name: document.getElementById('memberName').value,
                phone: document.getElementById('memberPhone').value,
                email: document.getElementById('memberEmail').value,
                status: document.getElementById('memberStatus').value
            };
    
            try {
                const memberId = document.getElementById('memberForm').dataset.memberId;
                if (memberId) {
                    await this.updateMember(memberId, memberData);
                } else {
                    await this.createMember(memberData);
                }
                this.hideModal();
                this.loadMembers();
            } catch (error) {
                console.error('儲存會員資料失敗:', error);
                this.showError('儲存會員資料失敗');
            }
        }
    
        async createMember(memberData) {
            // 模擬 API 呼叫
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(memberData)
            });
            return response.json();
        }
    
        async updateMember(memberId, memberData) {
            // 模擬 API 呼叫
            const response = await fetch(`/api/members/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(memberData)
            });
            return response.json();
        }
    
        async deleteMember(memberId) {
            if (!confirm('確定要刪除此會員嗎？')) return;
    
            try {
                // 模擬 API 呼叫
                await fetch(`/api/members/${memberId}`, {
                    method: 'DELETE'
                });
                this.loadMembers();
            } catch (error) {
                console.error('刪除會員失敗:', error);
                this.showError('刪除會員失敗');
            }
        }
    
        filterMembers(searchTerm) {
            const filtered = this.members.filter(member => 
                member.name.includes(searchTerm) ||
                member.phone.includes(searchTerm) ||
                member.email.includes(searchTerm)
            );
            this.renderFilteredMembers(filtered);
        }
    
        showModal(member = null) {
            const modal = document.getElementById('memberModal');
            const form = document.getElementById('memberForm');
            const modalTitle = document.getElementById('modalTitle');
    
            if (member) {
                modalTitle.textContent = '編輯會員';
                form.dataset.memberId = member.id;
                document.getElementById('memberName').value = member.name;
                document.getElementById('memberPhone').value = member.phone;
                document.getElementById('memberEmail').value = member.email;
                document.getElementById('memberStatus').value = member.status;
            } else {
                modalTitle.textContent = '新增會員';
                form.dataset.memberId = '';
                form.reset();
            }
    
            modal.style.display = 'block';
        }
    
        hideModal() {
            document.getElementById('memberModal').style.display = 'none';
        }
    
        showError(message) {
            // 實作錯誤訊息顯示邏輯
            alert(message);
        }
    
        escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    }
    
    const manager = new MemberManager();
    
    return function cleanup() {
        // 移除事件監聽
        document.getElementById('addMemberBtn')?.removeEventListener('click');
        document.getElementById('memberSearch')?.removeEventListener('input');
        document.querySelector('.close')?.removeEventListener('click');
        document.getElementById('cancelBtn')?.removeEventListener('click');
        document.getElementById('memberForm')?.removeEventListener('submit');
        
        // 清理状态
        manager.members = [];
        manager.currentPage = 1;
    };
}