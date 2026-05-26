// Task Board Application
class TaskBoard {
    constructor() {
        this.lists = [];
        this.currentTaskList = null;
        this.currentTaskId = null;
        this.draggedTask = null;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.render();
        this.attachEventListeners();
    }
    
    loadData() {
        const saved = localStorage.getItem('taskBoard');
        if (saved) {
            this.lists = JSON.parse(saved);
        } else {
            // Default lists
            this.lists = [
                {
                    id: 'list1',
                    title: 'To Do',
                    tasks: []
                },
                {
                    id: 'list2',
                    title: 'In Progress',
                    tasks: []
                },
                {
                    id: 'list3',
                    title: 'Done',
                    tasks: []
                }
            ];
        }
    }
    
    saveData() {
        localStorage.setItem('taskBoard', JSON.stringify(this.lists));
    }
    
    render() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        
        this.lists.forEach(list => {
            const listElement = this.createListElement(list);
            board.appendChild(listElement);
        });
    }
    
    createListElement(list) {
        const listDiv = document.createElement('div');
        listDiv.className = 'list';
        listDiv.dataset.listId = list.id;
        
        listDiv.innerHTML = `
            <div class="list-header">
                <h3 contenteditable="true" class="list-title" data-list-id="${list.id}">${list.title}</h3>
                <button class="delete-list" data-list-id="${list.id}">🗑️</button>
            </div>
            <div class="tasks-container" data-list-id="${list.id}">
                ${list.tasks.map(task => this.createTaskElement(task, list.id)).join('')}
            </div>
            <button class="add-task-btn" data-list-id="${list.id}">+ Add a task</button>
        `;
        
        return listDiv;
    }
    
    createTaskElement(task, listId) {
        return `
            <div class="task-card" draggable="true" data-task-id="${task.id}" data-list-id="${listId}">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-desc">${this.escapeHtml(task.description || 'No description')}</div>
                <div class="task-actions">
                    <button class="edit-task" data-task-id="${task.id}" data-list-id="${listId}">✏️ Edit</button>
                    <button class="delete-task" data-task-id="${task.id}" data-list-id="${listId}">🗑️ Delete</button>
                </div>
            </div>
        `;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    addList() {
        const title = prompt('Enter list name:');
        if (title) {
            const newList = {
                id: 'list_' + Date.now(),
                title: title,
                tasks: []
            };
            this.lists.push(newList);
            this.saveData();
            this.render();
        }
    }
    
    deleteList(listId) {
        if (confirm('Delete this entire list? All tasks will be lost.')) {
            this.lists = this.lists.filter(list => list.id !== listId);
            this.saveData();
            this.render();
        }
    }
    
    updateListTitle(listId, newTitle) {
        const list = this.lists.find(l => l.id === listId);
        if (list && newTitle.trim()) {
            list.title = newTitle.trim();
            this.saveData();
            this.render();
        }
    }
    
    addTask(listId) {
        const title = prompt('Enter task title:');
        if (title) {
            const description = prompt('Enter description (optional):') || '';
            const newTask = {
                id: 'task_' + Date.now(),
                title: title,
                description: description
            };
            const list = this.lists.find(l => l.id === listId);
            list.tasks.push(newTask);
            this.saveData();
            this.render();
        }
    }
    
    editTask(taskId, listId) {
        const list = this.lists.find(l => l.id === listId);
        const task = list.tasks.find(t => t.id === taskId);
        
        const newTitle = prompt('Edit task title:', task.title);
        if (newTitle) {
            task.title = newTitle;
            const newDesc = prompt('Edit description:', task.description);
            task.description = newDesc || '';
            this.saveData();
            this.render();
        }
    }
    
    deleteTask(taskId, listId) {
        if (confirm('Delete this task?')) {
            const list = this.lists.find(l => l.id === listId);
            list.tasks = list.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.render();
        }
    }
    
    attachEventListeners() {
        // Add list button
        document.getElementById('addListBtn').addEventListener('click', () => this.addList());
        
        // Event delegation for dynamic elements
        document.getElementById('board').addEventListener('click', (e) => {
            // Delete list
            if (e.target.classList.contains('delete-list')) {
                this.deleteList(e.target.dataset.listId);
            }
            
            // Add task
            if (e.target.classList.contains('add-task-btn')) {
                this.addTask(e.target.dataset.listId);
            }
            
            // Edit task
            if (e.target.classList.contains('edit-task')) {
                this.editTask(e.target.dataset.taskId, e.target.dataset.listId);
            }
            
            // Delete task
            if (e.target.classList.contains('delete-task')) {
                this.deleteTask(e.target.dataset.taskId, e.target.dataset.listId);
            }
        });
        
        // Edit list title
        document.getElementById('board').addEventListener('blur', (e) => {
            if (e.target.classList.contains('list-title')) {
                this.updateListTitle(e.target.dataset.listId, e.target.innerText);
            }
        }, true);
        
        // Drag and drop
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const board = document.getElementById('board');
        
        board.addEventListener('dragstart', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (taskCard) {
                this.draggedTask = {
                    taskId: taskCard.dataset.taskId,
                    sourceListId: taskCard.dataset.listId
                };
                e.dataTransfer.setData('text/plain', '');
                taskCard.classList.add('dragging');
            }
        });
        
        board.addEventListener('dragend', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (taskCard) {
                taskCard.classList.remove('dragging');
            }
            document.querySelectorAll('.tasks-container').forEach(container => {
                container.classList.remove('drop-zone');
            });
            this.draggedTask = null;
        });
        
        board.addEventListener('dragover', (e) => {
            e.preventDefault();
            const tasksContainer = e.target.closest('.tasks-container');
            if (tasksContainer && this.draggedTask) {
                tasksContainer.classList.add('drop-zone');
            }
        });
        
        board.addEventListener('dragleave', (e) => {
            const tasksContainer = e.target.closest('.tasks-container');
            if (tasksContainer) {
                tasksContainer.classList.remove('drop-zone');
            }
        });
        
        board.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetContainer = e.target.closest('.tasks-container');
            if (targetContainer && this.draggedTask) {
                const targetListId = targetContainer.dataset.listId;
                if (this.draggedTask.sourceListId !== targetListId) {
                    this.moveTask(this.draggedTask.taskId, this.draggedTask.sourceListId, targetListId);
                }
                targetContainer.classList.remove('drop-zone');
            }
        });
    }
    
    moveTask(taskId, sourceListId, targetListId) {
        const sourceList = this.lists.find(l => l.id === sourceListId);
        const targetList = this.lists.find(l => l.id === targetListId);
        
        const taskIndex = sourceList.tasks.findIndex(t => t.id === taskId);
        const task = sourceList.tasks[taskIndex];
        
        sourceList.tasks.splice(taskIndex, 1);
        targetList.tasks.push(task);
        
        this.saveData();
        this.render();
    }
}

// Start the app
const app = new TaskBoard();