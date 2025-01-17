document.addEventListener('DOMContentLoaded', function() {
    let selectedDate = null;
    
    // 更新年度进度
    function updateYearProgress() {
        const now = new Date();
        const start = new Date(2025, 0, 1);
        const end = new Date(2025, 11, 31, 23, 59, 59);
        const progress = ((now - start) / (end - start)) * 100;
        
        document.getElementById('yearProgressBar').style.width = progress + '%';
        document.getElementById('yearProgress').textContent = progress.toFixed(1) + '%';
    }

    // 获取月份数据
    async function fetchMonthData(year, month) {
        try {
            const response = await fetch(`/api/calendar?year=${year}&month=${month}`);
            if (!response.ok) {
                throw new Error('Failed to fetch calendar data');
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            renderMonth(month, data.calendar);
            return data;
        } catch (error) {
            console.error('获取月份数据失败:', error);
            return null;
        }
    }

    // 计算月份进度
    function updateMonthProgress() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDate = now.getDate();

        for (let month = 1; month <= 12; month++) {
            const daysInMonth = new Date(2025, month, 0).getDate();
            let progress = 0;

            if (currentYear === 2025 && currentMonth === month) {
                progress = (currentDate / daysInMonth * 100).toFixed(1);
            } else if (currentYear === 2025 && currentMonth > month) {
                progress = 100;
            }

            const progressElement = document.getElementById(`progress-${month}`);
            if (progressElement) {
                progressElement.textContent = progress + '%';
            }
        }
    }

    // 渲染月份
    function renderMonth(month, calendarData) {
        const monthContainer = document.getElementById(`month-${month}`);
        if (!monthContainer) return;
        
        monthContainer.innerHTML = '';

        // 添加星期头部
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        weekdays.forEach(day => {
            const header = document.createElement('div');
            header.className = 'weekday-header';
            header.textContent = day;
            headerRow.appendChild(header);
        });
        monthContainer.appendChild(headerRow);

        // 创建日历网格
        const gridContainer = document.createElement('div');
        gridContainer.className = 'calendar-grid';

        // 添加日期单元格
        if (Array.isArray(calendarData)) {
            calendarData.forEach(week => {
                if (Array.isArray(week)) {
                    week.forEach(day => {
                        const cell = document.createElement('div');
                        cell.className = 'day-cell';
                        
                        if (day.day !== '') {
                            const dayNumber = document.createElement('div');
                            dayNumber.className = 'day-number';
                            dayNumber.textContent = day.day;
                            cell.appendChild(dayNumber);
                            
                            // 添加事件和备忘录标记的容器
                            const marksContainer = document.createElement('div');
                            marksContainer.className = 'marks-container';
                            
                            // 添加事件标记
                            if (Array.isArray(day.events) && day.events.length > 0) {
                                const eventMark = document.createElement('div');
                                eventMark.className = 'event-mark';
                                eventMark.title = day.events.join('\n');
                                marksContainer.appendChild(eventMark);
                            }
                            
                            // 添加备忘录标记
                            if (Array.isArray(day.notes) && day.notes.length > 0) {
                                const noteMark = document.createElement('div');
                                noteMark.className = 'note-mark';
                                noteMark.title = day.notes.join('\n');
                                marksContainer.appendChild(noteMark);
                            }
                            
                            cell.appendChild(marksContainer);
                            
                            // 判断日期状态
                            if (day.is_today) {
                                cell.classList.add('today');
                            }
                            
                            // 添加点击事件处理
                            const date = `2025-${String(month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
                            cell.addEventListener('click', () => handleDayClick(date));
                        } else {
                            cell.classList.add('empty-cell');
                        }
                        
                        gridContainer.appendChild(cell);
                    });
                }
            });
        }

        monthContainer.appendChild(gridContainer);
        
        // 添加调试信息
        console.log(`Rendered month ${month}:`, { calendarData });
    }

    // 处理日期点击
    function handleDayClick(date) {
        selectedDate = date;
        document.getElementById('memoDate').value = date;
        document.getElementById('eventDate').value = date;
        document.getElementById('nav-memo-tab').click();
    }

    // 加载事件列表
    async function loadEvents() {
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            const events = data.events || {};
            
            // 更新事件列表
            const eventList = document.getElementById('eventList');
            if (eventList) {
                eventList.innerHTML = '';
                Object.entries(events)
                    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                    .forEach(([date, description]) => {
                        const item = document.createElement('div');
                        item.className = 'list-group-item';
                        item.innerHTML = `
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${date}</strong><br>
                                    <span>${description}</span>
                                </div>
                                <button class="btn btn-danger btn-sm" onclick="deleteEvent('${description}')">删除</button>
                            </div>
                        `;
                        eventList.appendChild(item);
                    });
            }
            return events;
        } catch (error) {
            console.error('加载事件失败:', error);
            return {};
        }
    }

    // 加载备忘录
    async function loadNotes() {
        try {
            const response = await fetch('/api/notes');
            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            const notes = data.notes || [];
            
            // 更新备忘录列表
            const noteList = document.getElementById('noteList');
            if (noteList) {
                noteList.innerHTML = '';
                notes.sort((a, b) => new Date(b.date) - new Date(a.date))
                    .forEach(note => {
                        const item = document.createElement('div');
                        item.className = 'list-group-item';
                        item.innerHTML = `
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${note.date}</strong><br>
                                    <span>${note.content}</span>
                                </div>
                                <button class="btn btn-danger btn-sm" onclick="deleteNote('${note.id}')">删除</button>
                            </div>
                        `;
                        noteList.appendChild(item);
                    });
            }
        } catch (error) {
            console.error('加载备忘录失败:', error);
        }
    }

    // 初始化事件表单
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const date = document.getElementById('eventDate').value;
            const description = document.getElementById('eventDescription').value;
            
            if (!date || !description) {
                alert('请填写日期和事件描述');
                return;
            }
            
            try {
                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ date, description })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to add event');
                }
                
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                
                document.getElementById('eventDate').value = '';
                document.getElementById('eventDescription').value = '';
                await loadEvents();
                await initCalendar();
            } catch (error) {
                console.error('添加事件失败:', error);
                alert('添加事件失败: ' + error.message);
            }
        });
    }

    // 初始化备忘录表单
    const memoForm = document.getElementById('memoForm');
    if (memoForm) {
        memoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const date = document.getElementById('memoDate').value;
            const content = document.getElementById('memoContent').value;
            
            if (!date || !content) {
                alert('请填写日期和备忘录内容');
                return;
            }
            
            try {
                const response = await fetch('/api/notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ date, content })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to add note');
                }
                
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                
                document.getElementById('memoDate').value = '';
                document.getElementById('memoContent').value = '';
                await loadNotes();
                await initCalendar();
            } catch (error) {
                console.error('添加备忘录失败:', error);
                alert('添加备忘录失败: ' + error.message);
            }
        });
    }

    // 删除事件
    window.deleteEvent = async function(description) {
        if (!confirm('确定要删除这个事件吗？')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/events/${encodeURIComponent(description)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete event');
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            await loadEvents();
            await initCalendar();
        } catch (error) {
            console.error('删除事件失败:', error);
            alert('删除事件失败: ' + error.message);
        }
    };

    // 删除备忘录
    window.deleteNote = async function(id) {
        if (!confirm('确定要删除这条备忘录吗？')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete note');
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            await loadNotes();
            await initCalendar();
        } catch (error) {
            console.error('删除备忘录失败:', error);
            alert('删除备忘录失败: ' + error.message);
        }
    };

    // 更新时钟显示
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
        
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const day = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
        
        document.getElementById('date').textContent = `${year}年${month}月${date}日 星期${day}`;
        
        updateYearProgress();
        updateMonthProgress();
    }

    // 初始化日历
    async function initCalendar() {
        const currentYear = 2025;
        for (let month = 1; month <= 12; month++) {
            await fetchMonthData(currentYear, month);
        }
    }

    // 初始化
    async function initialize() {
        await initCalendar();
        await loadEvents();
        await loadNotes();
        updateClock();
        setInterval(updateClock, 1000);
    }

    initialize();
});
