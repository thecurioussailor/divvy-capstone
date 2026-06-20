/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/divvy.json`.
 */
export type Divvy = {
  "address": "CnjNV7e85KNBVEgDUkWwnRj8nthUYnaob9nFGFeXbTpT",
  "metadata": {
    "name": "divvy",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "activateSplit",
      "discriminator": [
        83,
        151,
        232,
        22,
        12,
        17,
        4,
        29
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "splitConfig"
          ]
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "split_config.authority",
                "account": "splitConfig"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "addMember",
      "discriminator": [
        13,
        116,
        123,
        130,
        126,
        198,
        57,
        34
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "splitConfig"
          ]
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "memberAllocation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "splitConfig"
              },
              {
                "kind": "arg",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "member",
          "type": "pubkey"
        },
        {
          "name": "shareBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true,
          "relations": [
            "memberAllocation"
          ]
        },
        {
          "name": "splitConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "split_config.authority",
                "account": "splitConfig"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "memberAllocation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "splitConfig"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "memberTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "member"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "closeMember",
      "docs": [
        "Close a fully-claimed member's account during wind-down (Paused). Authority only."
      ],
      "discriminator": [
        221,
        98,
        181,
        59,
        120,
        117,
        20,
        22
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "splitConfig"
          ]
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "split_config.authority",
                "account": "splitConfig"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "memberAllocation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "splitConfig"
              },
              {
                "kind": "arg",
                "path": "member"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "member",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "closeSplit",
      "docs": [
        "Close the split: requires Paused and all members closed. Sweeps dust, reclaims rent."
      ],
      "discriminator": [
        22,
        32,
        88,
        169,
        165,
        249,
        251,
        232
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "splitConfig"
          ]
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "split_config.authority",
                "account": "splitConfig"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "authorityTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "split_config.authority",
                "account": "splitConfig"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "depositorTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeSplit",
      "discriminator": [
        53,
        17,
        92,
        9,
        84,
        151,
        173,
        78
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "splitId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "splitConfig"
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "splitId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pauseSplit",
      "discriminator": [
        211,
        9,
        244,
        30,
        56,
        109,
        201,
        106
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "splitConfig"
          ]
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "split_config.authority",
                "account": "splitConfig"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "resumeSplit",
      "discriminator": [
        151,
        208,
        1,
        155,
        141,
        80,
        120,
        39
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "splitConfig"
          ]
        },
        {
          "name": "splitConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  108,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "split_config.authority",
                "account": "splitConfig"
              },
              {
                "kind": "account",
                "path": "split_config.split_id",
                "account": "splitConfig"
              }
            ]
          }
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "memberAllocation",
      "discriminator": [
        206,
        61,
        79,
        66,
        146,
        200,
        159,
        57
      ]
    },
    {
      "name": "splitConfig",
      "discriminator": [
        49,
        201,
        50,
        228,
        22,
        142,
        12,
        222
      ]
    }
  ],
  "events": [
    {
      "name": "claimEvent",
      "discriminator": [
        93,
        15,
        70,
        170,
        48,
        140,
        212,
        219
      ]
    },
    {
      "name": "depositEvent",
      "discriminator": [
        120,
        248,
        61,
        83,
        31,
        142,
        107,
        144
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAllocationSum",
      "msg": "Allocations must sum to exactly 10000 basis points"
    },
    {
      "code": 6001,
      "name": "noMembers",
      "msg": "The split must have at least one member"
    },
    {
      "code": 6002,
      "name": "tooManyMembers",
      "msg": "Too many members for this split"
    },
    {
      "code": 6003,
      "name": "splitNotActive",
      "msg": "The split is not active"
    },
    {
      "code": 6004,
      "name": "splitPaused",
      "msg": "The split is paused"
    },
    {
      "code": 6005,
      "name": "splitClosed",
      "msg": "The split is closed"
    },
    {
      "code": 6006,
      "name": "splitNotDraft",
      "msg": "The split must be in draft for this action"
    },
    {
      "code": 6007,
      "name": "splitNotPaused",
      "msg": "The split is not paused"
    },
    {
      "code": 6008,
      "name": "unauthorized",
      "msg": "Only the authority may perform this action"
    },
    {
      "code": 6009,
      "name": "nothingToClaim",
      "msg": "Nothing is available to claim"
    },
    {
      "code": 6010,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6011,
      "name": "vaultNotEmpty",
      "msg": "The vault must be empty before closing"
    },
    {
      "code": 6012,
      "name": "zeroShare",
      "msg": "Share must be greater than zero"
    },
    {
      "code": 6013,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6014,
      "name": "wrongMint",
      "msg": "Token account mint does not match the split"
    },
    {
      "code": 6015,
      "name": "transferFeeNotSupported",
      "msg": "Mints with a transfer-fee extension are not supported"
    },
    {
      "code": 6016,
      "name": "memberHasUnclaimedFunds",
      "msg": "Member still has unclaimed funds"
    },
    {
      "code": 6017,
      "name": "membersRemaining",
      "msg": "All members must be closed before closing the split"
    },
    {
      "code": 6018,
      "name": "teardownInProgress",
      "msg": "Cannot resume a split whose teardown has started"
    }
  ],
  "types": [
    {
      "name": "claimEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "split",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "totalClaimed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "depositEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "split",
            "type": "pubkey"
          },
          {
            "name": "payer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "memberAllocation",
      "docs": [
        "One per member of a split. Allocation is fixed once the split is activated."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "split",
            "docs": [
              "The split this allocation belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "member",
            "docs": [
              "The member's wallet."
            ],
            "type": "pubkey"
          },
          {
            "name": "shareBps",
            "docs": [
              "Fixed share in basis points (10000 = 100%)."
            ],
            "type": "u16"
          },
          {
            "name": "totalClaimed",
            "docs": [
              "Cumulative amount this member has already claimed."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for this PDA."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "splitConfig",
      "docs": [
        "The pool's settings. One per (authority, split_id)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Admin allowed to manage the split"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "The SPL mint this split accepts (e.g. USDC)"
            ],
            "type": "pubkey"
          },
          {
            "name": "splitId",
            "docs": [
              "Distinguishes multiple splits owned by the same authority."
            ],
            "type": "u64"
          },
          {
            "name": "status",
            "docs": [
              "Lifecycle state."
            ],
            "type": {
              "defined": {
                "name": "splitStatus"
              }
            }
          },
          {
            "name": "memberCount",
            "docs": [
              "Number of members added."
            ],
            "type": "u8"
          },
          {
            "name": "totalBps",
            "docs": [
              "Running sum of member shares; must equal 10000 to activate"
            ],
            "type": "u16"
          },
          {
            "name": "totalDeposited",
            "docs": [
              "Cumulative tokens ever deposited (basis for claim math)"
            ],
            "type": "u64"
          },
          {
            "name": "vaultBump",
            "docs": [
              "Bump for the vault PDA"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for this config PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "splitStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "draft"
          },
          {
            "name": "active"
          },
          {
            "name": "paused"
          },
          {
            "name": "closed"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "memberSeed",
      "type": "bytes",
      "value": "[109, 101, 109, 98, 101, 114]"
    },
    {
      "name": "splitSeed",
      "type": "bytes",
      "value": "[115, 112, 108, 105, 116]"
    },
    {
      "name": "vaultSeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    }
  ]
};
