class Queue {
    constructor() {
        this.oldestIndex = 0; // Represents the index of the oldest element in the queue
        this.newestIndex = 0; // Represents the index of the newest element in the queue
        this.storage = {}; // Object used to store the elements of the queue
    }

    size() {
        return this.newestIndex - this.oldestIndex; // Returns the number of elements in the queue
    }

    enqueue(data) {
        this.storage[this.newestIndex] = data; // Adds the given data to the queue at the newest index
        this.newestIndex++; // Increments the newest index to point to the next position
    }

    dequeue() {
        if (this.oldestIndex === this.newestIndex) {
            return null; // Returns null if the queue is empty
        }

        const deletedData = this.storage[this.oldestIndex]; // Retrieves the data at the oldest index
        delete this.storage[this.oldestIndex]; // Removes the data from the queue
        this.oldestIndex++; // Increments the oldest index to point to the next position

        return deletedData; // Returns the deleted data
    }
}

module.exports = Queue;
