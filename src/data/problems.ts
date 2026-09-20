export interface PreCuratedProblem {
  id: string;
  title: string;
  mode: 'dsa' | 'system_design' | 'machine_coding';
  difficulty: 'easy' | 'medium' | 'hard';
  companies: string[];
  tags: string[];
  goal: string;
  details: string;
  inputStatement: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  expected_answer_outline: string[];
}

export const PRE_CURATED_PROBLEMS: PreCuratedProblem[] = [
  {
    id: "lru-cache",
    title: "LRU Cache Implementation",
    mode: "dsa",
    difficulty: "medium",
    companies: ["Google", "Meta", "Amazon", "Microsoft"],
    tags: ["Design", "Linked List", "Hash Table"],
    goal: "Implement a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    details: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. It should support get and put operations in O(1) average time complexity.",
    inputStatement: "Implement the LRUCache class:\n- 'LRUCache(int capacity)' Initializes the LRU cache with positive size capacity.\n- 'int get(int key)' Returns the value of the key if the key exists, otherwise returns -1.\n- 'void put(int key, int value)' Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.",
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: "[null, null, null, 1, null, -1, null, -1, 3, 4]",
        explanation: "LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache is {1=1}\nlRUCache.put(2, 2); // cache is {1=1, 2=2}\nlRUCache.get(1);    // return 1\nlRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}\nlRUCache.get(2);    // returns -1 (not found)"
      }
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5",
      "At most 2 * 10^5 calls will be made to get and put."
    ],
    expected_answer_outline: [
      "Use Doubly Linked List for O(1) eviction and insertion.",
      "Use HashMap / Object for O(1) key-based lookups.",
      "Correctly handle head and tail sentinel node shifts during cache access.",
      "Achieve strict O(1) time complexity for both get and put operations."
    ]
  },
  {
    id: "merge-k-lists",
    title: "Merge K Sorted Lists",
    mode: "dsa",
    difficulty: "hard",
    companies: ["Meta", "Google", "Netflix"],
    tags: ["Divide and Conquer", "Heap (Priority Queue)", "Linked List"],
    goal: "Merge k sorted linked lists into one sorted linked list and return it.",
    details: "You are given an array of k linked-lists 'lists', each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it. Optimize for both processing time and minimal extra space.",
    inputStatement: "Input is an array of k sorted linked lists. Output should be a single merged linked list in ascending order.",
    examples: [
      {
        input: "lists = [[1,4,5],[1,3,4],[2,6]]",
        output: "[1,1,2,3,4,4,5,6]",
        explanation: "The integrated lists are:\n[\n  1->4->5,\n  1->3->4,\n  2->6\n]\nMerging them into one sorted list:\n1->1->2->3->4->4->5->6"
      }
    ],
    constraints: [
      "k == lists.length",
      "0 <= k <= 10^4",
      "0 <= lists[i].length <= 500",
      "-10^4 <= lists[i][j] <= 10^4",
      "lists[i] is sorted in ascending order."
    ],
    expected_answer_outline: [
      "Discuss Priority Queue / Min-Heap approach with O(N log k) time complexity and O(k) auxiliary space.",
      "Discuss Divide and Conquer merging strategy with O(N log k) time and O(1) auxiliary space if done iteratively.",
      "Compare space-time trade-offs of Heap vs Divide and Conquer.",
      "Handle edge cases such as empty list arrays, lists containing empty nodes, or lists of varying lengths."
    ]
  },
  {
    id: "median-two-arrays",
    title: "Median of Two Sorted Arrays",
    mode: "dsa",
    difficulty: "hard",
    companies: ["Google", "Apple", "Microsoft"],
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    goal: "Find the median of two sorted arrays in logarithmic time complexity.",
    details: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
    inputStatement: "Input consists of two separately sorted integer arrays nums1 and nums2. Output is the calculated median value (double representation).",
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "Merged array is [1,2,3] and the median is 2."
      },
      {
        input: "nums1 = [1,2], nums2 = [3,4]",
        output: "2.50000",
        explanation: "Merged array is [1,2,3,4] and the median is (2 + 3) / 2 = 2.5."
      }
    ],
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6"
    ],
    expected_answer_outline: [
      "Binary Search on the partitions of the smaller array to find correct divider in log(min(m, n)) time.",
      "Formulate partition rules: maxLeftX <= minRightY and maxLeftY <= minRightX.",
      "Manage combined odd or even lengths calculations correctly.",
      "Handle index out of bound conditions when indices fall on borders of arrays."
    ]
  },
  {
    id: "two-sum",
    title: "Two Sum Problem",
    mode: "dsa",
    difficulty: "easy",
    companies: ["Amazon", "Meta", "Google", "Apple", "Adobe"],
    tags: ["Array", "Hash Table"],
    goal: "Find two numbers in an array that add up to a specific target.",
    details: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    inputStatement: "Input consists of an array of integers nums and an target integer. Output is a pair of indices of elements summing up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    expected_answer_outline: [
      "Use Hash Map to lookup complement values (target - nums[i]) in O(1) average time.",
      "Establish O(n) overall time efficiency and O(n) space complexity.",
      "Discuss brute force fallback O(n^2) and explain why hash mapping is superior."
    ]
  },
  {
    id: "system-rate-limiter",
    title: "Design a Distributed Rate Limiter",
    mode: "system_design",
    difficulty: "medium",
    companies: ["Google", "Uber", "Stripe", "Microsoft"],
    tags: ["Redis", "Distributed Systems", "API Gateway"],
    goal: "Design a high-throughput, low-latency distributed rate limiter.",
    details: "Design a distributed rate limiter that can protect millions of public API endpoints across multiple data centers. It must support multiple rate-limiting algorithms, handle explosive backpressure, and run with sub-millisecond overhead.",
    inputStatement: "Your design must specify:\n1. Core API parameters and system architecture flow.\n2. In-memory storage schema for client token counting.\n3. Handling distributed sync locks and avoiding race conditions (such as concurrency write issues).",
    examples: [
      {
        input: "10,000 requests/sec limit per client ID under distributed clusters.",
        output: "System architecture design including API Gateways, localized Redis caches, sliding-window algorithms, and asynchronous replication.",
        explanation: "User presents layout mapping local token bucket nodes paired with global synchronized counters inside high-speed caching clusters."
      }
    ],
    constraints: [
      "API overhead must not exceed 5ms per check.",
      "Highly resilient: fail-soft (if rate-limiter cluster goes offline, requests should still process but generate alerts).",
      "Minimize sync lag across geographic regions."
    ],
    expected_answer_outline: [
      "Compare Sliding Window Log, Token Bucket, and Leaky Bucket algorithms.",
      "Use Redis for atomic storage (utilize sorted sets or Lua scripts for thread-safe sliding window metrics).",
      "Elucidate on fail-open vs fail-closed strategies.",
      "Explain master-replica syncing models and local caching options to prevent Redis bottlenecks."
    ]
  },
  {
    id: "system-chat-whatsapp",
    title: "High-Throughput Messenger (WhatsApp/Slack)",
    mode: "system_design",
    difficulty: "hard",
    companies: ["Meta", "Netflix", "Amazon", "Uber"],
    tags: ["WebSockets", "NoSQL", "Real-time Messaging"],
    goal: "Design a persistent, end-to-end messaging platform supporting millions of concurrent channels.",
    details: "Design the client-to-server and backend-to-client system architecture for a massive messaging app like WhatsApp or Slack. The system must support instant text delivery, offline buffering, message read/status receipts, and group messages with end-to-end encryption details.",
    inputStatement: "Detail state synchronizations, database selection (SQL vs NoSQL), database horizontal partitioning, and connection gateways keeping WebSockets open.",
    examples: [
      {
        input: "Target of 500 million daily active users transmitting 50 billion messages total per day.",
        output: "Full multi-tier block diagram outlining WebSocket gateways, Cassandra messaging archives, group fan-out queues, and push notifications.",
        explanation: "Explain real-time message delivery flows, message status lifecycles (Sent, Delivered, Read), and sync operations."
      }
    ],
    constraints: [
      "Delay between sender sending the text and receiver receiving must be <200ms.",
      "Offline delivery reliability of 100% when active internet resumes.",
      "Minimize memory footprint on connection gateways."
    ],
    expected_answer_outline: [
      "Utilize permanent WebSockets for candidate gateway channels.",
      "Select Wide-Column NoSQL store (like Cassandra) because write operations outpace reads, with partition key based on 'chat_id'.",
      "Formulate active Group chat message fanout optimizations (push model for small groups, pull model for massive channels).",
      "Explicitly architecture a Distributed Presence Server using Redis with Heartbeat checks."
    ]
  },
  {
    id: "system-url-shortener",
    title: "scalable URL Shortener (TinyURL)",
    mode: "system_design",
    difficulty: "easy",
    companies: ["Amazon", "Microsoft", "Twitter", "Google"],
    tags: ["NoSQL", "Hashing", "Caching"],
    goal: "Design a service to convert long URLs into highly shortened redirection tokens.",
    details: "Design a system that converts a long destination link into a short 7-character string. The service must handle redirections instantly with heavy caching, and generate uniquely identifiable unique sequences.",
    inputStatement: "Provide database modeling, short url base-62 encoding logic, hashing collision handling, and caching policies.",
    examples: [
      {
        input: "Convert 'https://ai.studio/build/long-complex-url-path-here' into 'https://tiny.url/x7aB9d'",
        output: "A working design overview with Base62 token generator, metadata databases, and distributed caching clusters.",
        explanation: "Detail redirect workflows (301 Permanent Redirect vs 302 Temporary Redirect) and encoding options."
      }
    ],
    constraints: [
      "High read ratio (100:1 read to write ratio).",
      "Redirection latency should be less than 10ms.",
      "Uniqueness guaranteed: no duplicate short tokens."
    ],
    expected_answer_outline: [
      "Select Base62 encoding on unique incremental ID keys (instead of standard SHA-256 collisions).",
      "Integrate a pre-allocated Key Range Manager (ZooKeeper) to distribute ID ranges to stateless token generators safely.",
      "Use Redis in front of NoSQL store (MongoDB/DynamoDB) to cache hot redirection paths completely.",
      "Analyze 301 (Permanent Redirect - reduces server load) vs 302 (Temporary Redirect - allows better hit tracking / analytics)."
    ]
  },
  {
    id: "mc-keyvalue-store",
    title: "Transactional In-Memory Key-Value Store",
    mode: "machine_coding",
    difficulty: "hard",
    companies: ["Swiggy", "Uber", "Razorpay"],
    tags: ["Concurrency", "Transactions", "Thread-Safety"],
    goal: "Design and implement a single-machine core in-memory key-value database supporting nested transactions.",
    details: "Implement an in-memory key-value database on a single machine. The database must support basic operations (GET, SET, UNSET) alongside transactional commands: BEGIN (start nested transaction), COMMIT (persist changes), and ROLLBACK (discard latest transaction changes).",
    inputStatement: "Write clean, fully structured classes or pseudocode implementing the transaction stack, transaction scopes, and concurrency-safety logic.",
    examples: [
      {
        input: "SET a 10\nBEGIN\nSET a 20\nGET a -> returns 20\nBEGIN\nSET a 30\nGET a -> returns 30\nROLLBACK\nGET a -> returns 20\nCOMMIT\nGET a -> returns 20",
        output: "Object model mapping nested hash scopes, transactional commit, and rollback logic.",
        explanation: "A transaction stack keeps local dictionaries of active scopes. COMMIT flattens nested state to the parent scope, and ROLLBACK pops the active state."
      }
    ],
    constraints: [
      "All lookup, writes, and transaction pushes must run in O(1) time.",
      "Support infinite layers of nested transaction blocks.",
      "Ensure absolute thread safety when multiple clients access the same store."
    ],
    expected_answer_outline: [
      "Use a list/stack of dictionaries for active transactions.",
      "For GET, query from top of the stack downwards to find key. If key is deleted locally, return empty value.",
      "For COMMIT, merge top level map changes into the parent block or main store.",
      "Incorporate Thread-Locks (e.g. ReadWriteLocks) to guarantee concurrent safety across parallel thread access."
    ]
  },
  {
    id: "mc-parking-lot",
    title: "Thread-Safe Parking Lot Design",
    mode: "machine_coding",
    difficulty: "medium",
    companies: ["Amazon", "Flipkart", "Swiggy"],
    tags: ["SOLID", "Design Patterns", "Concurrency"],
    goal: "Design and implement a multi-floor parking lot with different vehicle types.",
    details: "Implement a parking lot system supporting multiple floors, varying parking slot sizes (Compact, Large, Handicapped, Motorcycle), ticket payment handling, and slot locating algorithms under heavy concurrent load.",
    inputStatement: "Provide the complete UML-equivalent class interface and concurrent booking functions.",
    examples: [
      {
        input: "Request parking ticket for a Large SUV on Floor 1. If Full, check higher floors. Complete checkout and payment.",
        output: "Fully compliant object models mapping ParkingFloor, ParkingSpot, Vehicle, Payment, and Gate Controllers.",
        explanation: "Provide thread safety (e.g. synchronized spot allocation, atomic counters) so slot locking is conflict-free."
      }
    ],
    constraints: [
      "No two parallel vehicle requests should ever obtain the same parking spot.",
      "Clear separation of concerns: payment processing separate from spot tracking."
    ],
    expected_answer_outline: [
      "Define clean inheritance models for Vehicle classes (Car, Truck, Bike).",
      "Adopt Singleton Pattern for ParkingSpace Manager, and Strategy Pattern for spot finding algorithms.",
      "Integrate Thread Synchronization locks (Mutex / Semaphore) on Spot allocation hooks.",
      "Ensure proper payment calculator strategies are dynamic (hour-based, vehicle-type multipliers)."
    ]
  },
  {
    id: "mc-pub-sub",
    title: "Event Pub-Sub Broker with Partitions",
    mode: "machine_coding",
    difficulty: "hard",
    companies: ["Uber", "Grab", "Hotstar"],
    tags: ["Event-Driven", "WebSockets", "Multithreading"],
    goal: "Design a high-throughput partitionable pub-sub message broker in-memory.",
    details: "Write a complete modular event broker where publishers publish events to specific 'Topics'. Subscriptions are organized into Consumer Groups. Within a topic, events are partitioned. Different threads or consumers should process partitions in parallel without blocking each other.",
    inputStatement: "Detail class interfaces for Topic, Partition, Message, ConsumerGroup, Broker. Write concurrent queue-polling logic.",
    examples: [
      {
        input: "Publish 1,000 logs into Topic 'orders' across 3 partitions. Read concurrently via Consumer Group 'log-processor'.",
        output: "Architectural code detailing lockless queues, offset storage, consumer-to-partition rebalancing, and thread-safe callbacks.",
        explanation: "Multiple subscription threads track their active offsets on distinct partitions, operating asynchronously."
      }
    ],
    constraints: [
      "Order must be strictly preserved within a single partition.",
      "Parallel workers should not lock each other out of separate partitions.",
      "Offset markers must be updated atomically upon consumer receipt."
    ],
    expected_answer_outline: [
      "Adopt concurrent locks (e.g., ReentrantLocks, ConcurrentLinkedQueue) for partition queue buffers.",
      "Enable offset managers that tracks consumer read progress per partition.",
      "Explain the Group Coordinator pattern that assigns partition arrays to members in a consumer group.",
      "Leverage ExecutorService thread pools for triggering asynchronous callbacks to subscribed listeners."
    ]
  }
];
