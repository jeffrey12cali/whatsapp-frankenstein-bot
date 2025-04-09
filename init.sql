-- Create CHATS table
DROP TABLE IF EXISTS `CHATS`;
CREATE TABLE `CHATS` (
  `chatId` varchar(35) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `isGroup` tinyint(1) NOT NULL,
  `lastActive` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`chatId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create USER table
DROP TABLE IF EXISTS `USER`;
CREATE TABLE `USER` (
  `num` varchar(20) NOT NULL,
  `prefix` varchar(6) NOT NULL,
  `iso3` varchar(3) NOT NULL,
  `country` tinytext NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create COMMANDS table
DROP TABLE IF EXISTS `COMMANDS`;
CREATE TABLE `COMMANDS` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `num` varchar(20) NOT NULL,
  `command` tinytext NOT NULL,
  `args` text DEFAULT NULL,
  `successful` tinyint(1) NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp(),
  `chatId` varchar(35) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `num` (`num`),
  KEY `COMMANDS_CHATS_FK` (`chatId`),
  CONSTRAINT `COMMANDS_CHATS_FK` FOREIGN KEY (`chatId`) REFERENCES `CHATS` (`chatId`),
  CONSTRAINT `COMMANDS_ibfk_1` FOREIGN KEY (`num`) REFERENCES `USER` (`num`)
) ENGINE=InnoDB AUTO_INCREMENT=26523 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create OLLAMA table (or any other tables)
DROP TABLE IF EXISTS `OLLAMA`;
CREATE TABLE `OLLAMA` (
  `chatId` varchar(35) NOT NULL,
  `history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`chatId`),
  CONSTRAINT `OLLAMA_CHATS_FK` FOREIGN KEY (`chatId`) REFERENCES `CHATS` (`chatId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

