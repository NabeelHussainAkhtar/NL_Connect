import { serializeRequest, deserializeResponse } from './protobuf-serializer';

type Task = {
    id: number;
    task: any;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    priority: number;
};

export default class WorkerPool {
    private workers: Worker[];
    private freeWorkers: Worker[];
    private taskQueue: Task[];
    private nextTaskId: number;
    private maxWorkers: number;
    private factory: () => Worker;

    constructor(factory: () => Worker, maxWorkers: number = 4) {
        this.workers = [];
        this.freeWorkers = [];
        this.taskQueue = [];
        this.nextTaskId = 0;
        this.maxWorkers = maxWorkers;
        this.factory = factory;

        // Initialize worker pool
        for (let i = 0; i < maxWorkers; i++) {
            this.addWorker();
        }
    }

    private addWorker() {
        // Native Browser Worker Initialization via factory for Vite compatibility
        const worker = this.factory();
        
        this.workers.push(worker);
        this.freeWorkers.push(worker);

        worker.onmessage = (event) => {
            const { id, result, error } = event.data;
            if (id !== undefined) {
                this.handleWorkerResponse(worker, { id, data: result, error });
            }
        };

        worker.onerror = (err) => {
            console.error(`Worker error:`, err);
            this.handleWorkerResponse(worker, { error: 'Worker crash' });
            this.removeWorker(worker);
        };
    }

    private removeWorker(worker: Worker) {
        const index = this.workers.indexOf(worker);
        if (index !== -1) {
            this.workers.splice(index, 1);
            const freeIndex = this.freeWorkers.indexOf(worker);
            if (freeIndex !== -1) {
                this.freeWorkers.splice(freeIndex, 1);
            }
            // Replace worker if needed
            if (this.workers.length < this.maxWorkers) {
                this.addWorker();
            }
        }
    }

    private handleWorkerResponse(worker: Worker, result: any) {
        const task = this.taskQueue.find(t => t.id === result.id);
        if (task) {
            if (result.error) {
                task.reject(new Error(result.error));
            } else {
                task.resolve(result.data);
            }
            // Remove task from queue
            const taskIndex = this.taskQueue.indexOf(task);
            if (taskIndex !== -1) {
                this.taskQueue.splice(taskIndex, 1);
            }
        }
        // Return worker to pool
        this.freeWorkers.push(worker);
        this.processQueue();
    }

    private processQueue() {
        if (this.freeWorkers.length > 0 && this.taskQueue.length > 0) {
            // Sort tasks by priority (higher first)
            this.taskQueue.sort((a, b) => b.priority - a.priority);

            const worker = this.freeWorkers.pop()!;
            const task = this.taskQueue.shift()!;

            // Post message to native worker
            worker.postMessage({
                id: task.id,
                task: task.task
            });
            
            // Re-add in-progress task for tracking if not already resolved/handled
            this.taskQueue.push(task);
        }
    }

    public runTask(task: any, priority: number = 0): Promise<any> {
        return new Promise((resolve, reject) => {
            const taskId = this.nextTaskId++;
            this.taskQueue.push({
                id: taskId,
                task,
                resolve,
                reject,
                priority
            });
            this.processQueue();
        });
    }

    public terminate() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.freeWorkers = [];
        this.taskQueue = [];
    }
}